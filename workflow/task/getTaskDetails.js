const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {

    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);

    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });

try {

  await client
  .connect()
  .then(() => {
      console.log("Connected to the database");
  })
  .catch((err) => {
      console.log("Error connecting to the database. Error :" + err);
  });

  const resource_id = event.queryStringParameters.resource_id;
  const query = `
      SELECT * 
      FROM tasks_table 
      WHERE assignee_id = $1
  `;

  const result = await client.query(query, [resource_id]);

  if (result.rows.length === 0) {
      return {
          statusCode: 404,
          body: JSON.stringify({ message: 'No tasks found for the given resource ID' }),
      };
  }

  const tasksList = result.rows.map(async row => {
      const projectResult = await client.query('SELECT * FROM projects_table WHERE id = $1', [row.project_id]);
      const project = projectResult.rows[0].project;

      const assignedByResult = await client.query('SELECT * FROM resources_table WHERE id = $1', [row.task.assigned_by_id]);

      if (assignedByResult.rows.length === 0) {
          return {
              task_id: row.id,
              task_name: row.stage, // or row.task_name depending on your actual structure
              project_id: row.project_id,
              project_name: project.name, // Get project name from projects_table
              assigned_by_id: row.task.assigned_by_id,
              assigned_by_name: 'Unknown', // or handle it differently based on your requirements
              task_assigned_date: row.task.task_assigned_date,
          };
      }

      const assignedByResource = assignedByResult.rows[0].resource;

      return {
          task_id: row.id,
          task_name: row.stage, // or row.task_name depending on your actual structure
          project_id: row.project_id,
          project_name: project.name, // Get project name from projects_table
          assigned_by_id: row.task.assigned_by_id,
          assigned_by_name: assignedByResource.name, // Get assigned_by_name from resources_table
          task_assigned_date: row.task.task_assigned_date,
      };
  });

  const resolvedTasksList = await Promise.all(tasksList);

  return {
      statusCode: 200,
      body: JSON.stringify(resolvedTasksList),
  };
} catch (error) {
  console.error('Error executing query:', error);
  return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
  };
} finally {
  await client.end();
}
};
