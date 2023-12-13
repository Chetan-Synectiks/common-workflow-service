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

        const projectFilter = event.queryStringParameters && event.queryStringParameters.status;
        console.log(projectFilter);

        let projectsQuery = `
            SELECT
                projects_table.id AS project_id,
                projects_table.project->>'name' AS project_name,
                projects_table.project->>'project_icon' AS project_icon_url,
                COUNT(usecases_table.project_id) AS total_usecases,
                projects_table.project->>'status' AS project_status,
                SUM(CASE WHEN jsonb_typeof(roles) = 'array' THEN jsonb_array_length(roles) ELSE 0 END) AS total_resources
            FROM
                projects_table
            LEFT JOIN
                usecases_table ON projects_table.id = usecases_table.project_id
            LEFT JOIN LATERAL (
                SELECT value->'role' AS roles
                FROM jsonb_each(projects_table.project->'teams')
            ) AS team_roles ON true
        `;

        if (projectFilter) {
            projectsQuery += ` WHERE projects_table.project->>'status' = '${projectFilter}'`;
        }

        projectsQuery += `
            GROUP BY
                projects_table.id, projects_table.project
        `;

        const projectsResult = await client.query(projectsQuery);

        const outputData = projectsResult.rows.map((project) => ({
            project_id: project.project_id,
            project_name: project.project_name,
            project_icon_url: project.project_icon_url,
            total_usecases: project.total_usecases || 0,
            total_resources: project.total_resources || 0,
            project_status: project.project_status
        }));

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(outputData)
        };
    } catch (error) {
        console.error('Error executing query:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    } finally {
        await client.end();
    }
};
