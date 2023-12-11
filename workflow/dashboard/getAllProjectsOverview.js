const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.getAllProjectsOverview = async (event, context, callback) => {
    
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

    data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    try {
        await client
		.connect()
		.then(() => {
			console.log("Connected to the database");
		})
		.catch((err) => {
			console.log("Error connecting to the database. Error :" + err);
		});

        const result = await client.query(`
            SELECT
                projects_table.id,
                usecases_table.usecase->>'status' as status,
                projects_table.project->>'name' as project_name,
                usecases_table.usecase->>'name' as usecase_name
            FROM
                projects_table
            JOIN
                usecases_table ON projects_table.id = usecases_table.project_id
            WHERE
                usecases_table.usecase->>'start_date' >= $1
                AND usecases_table.usecase->>'end_date' <= $2`, [data.from_date, data.to_date]
        );

        let projects = {};

        result.rows.forEach(row => {
            const projectName = row.project_name;

            if (!projects[projectName]) {
                projects[projectName] = {
                    project_name: projectName,
                    completed_usecases: 0,
                    incomplete_usecases: 0
                };
            }

            if (row.status === 'incomplete') {
                projects[projectName].incomplete_usecases++;
            } else if (row.status === 'completed') {
                projects[projectName].completed_usecases++;
            }
        });

        await client.end();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(projects)
        };
    } catch (e) {
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: e.message || "An error occurred" })
        };
    }
};