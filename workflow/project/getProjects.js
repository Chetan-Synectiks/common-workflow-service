exports.getProjects = async (event) => {
  
  const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
  const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
  const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
  const dbConfig = JSON.parse(configuration.SecretString);
  
  const { Client } = require("pg");
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'workflow',
    user: dbConfig.engine,
    password: dbConfig.password
  });
  client.connect();

  let values = event.queryStringParameters;
  let status;
  if (values) {
      status = values.status;
  }

  try {
      let usecase;
      if (status) {
          usecase = await client.query(
              `SELECT
                  projects_table.id AS project_id,
                  projects_table.project->>'status' as project_status,
                  projects_table.project->>'project_icon' as project_icon,
                  projects_table.project->>'name' as project_name,
                  SUM(jsonb_array_length(value->'role')) AS total_resources,
                  COUNT(usecases_table.project_id) AS total_usecases
              FROM
                  projects_table
              LEFT JOIN
                  usecases_table ON projects_table.id = usecases_table.project_id
              LEFT JOIN LATERAL jsonb_each(projects_table.project->'teams') AS teams ON true
              WHERE
                  projects_table.project->>'status' = $1 
              GROUP BY
                  projects_table.id, projects_table.project`,
              [status]
          );
      } else {
        usecase = await client.query(`SELECT
              projects_table.id AS project_id,
              projects_table.project->>'status' as project_status,
              projects_table.project->>'project_icon' as project_icon,
              projects_table.project->>'name' as project_name,
              SUM(jsonb_array_length(value->'role')) AS total_resources,
              COUNT(usecases_table.project_id) AS total_usecases
          FROM
              projects_table
          LEFT JOIN
              usecases_table ON projects_table.id = usecases_table.project_id
          LEFT JOIN LATERAL jsonb_each(projects_table.project->'teams') AS teams ON true
          GROUP BY
              projects_table.id, projects_table.project`);
      }

      let projectsDetails = usecase.rows.map((row) => ({
          project_id: row.project_id,
          project_name: row.project_name,
          total_usecases: row.total_usecases,
          project_status: row.project_status,
          total_resources: row.total_resources,
          project_icon_url: row.project_icon,
      }));

      client.end();
      return {
        statusCode: 200,
        body: JSON.stringify({projectsDetails}),
      };
  } catch (e) {
      client.end();

      return {
          statusCode: 400,
          headers: {
              "Access-Control-Allow-Origin": "*",
          },
          message: "error",
      };
  }
};
