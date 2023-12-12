exports.handler = async (event, context, callback) => {
    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);
    
    const { Client } = require('pg');
    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });
    await client.connect();
try {
    const resource_id = event.queryStringParameters.resource_id;
    const query = `
  SELECT * 
  FROM tasks_table 
  WHERE assignee_id = $1
`;

const result = await client.query(query, [resource_id]);

    const tasksList = result.rows.map(row => {
      // You can modify this mapping based on your needs
      return {
        task_id: row.id,
        task_name:row.name,
        project_id: row.project_id,
        assignee_id: row.assignee_id,
        stage: row.stage,
        task: {
          created_date: row.task.created_date,
          start_date: row.task.start_date,
          end_date: row.task.end_date,
          resource_start_date: row.task.resource_start_date,
          resource_end_date: row.task.resource_end_date,
          status: row.task.status,
          comments: row.task.comments,
        },
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(tasksList),
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




