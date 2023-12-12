const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.addProject = async (event) => {
    
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

    const requestBody = JSON.parse(event.body);

    try {
        await client
        .connect()
        .then(() => {
            console.log("Connected to the database");
        })
        .catch((err) => {
            console.log("Error connecting to the database. Error :" + err);
        });

        if (!requestBody.status) {
            requestBody.status = 'unassigned';
        }

        const result = await client.query(
            `INSERT INTO projects_table (project)
             VALUES ($1::jsonb) RETURNING id as project_id,
            (project->>\'name\')::text as project_name`,
            [requestBody]  
        );
        

        const insertedData = result.rows[0];

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                project_id: insertedData.project_id,
                project_name: insertedData.project_name
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
            }),
        };
    } finally {
        await client.end();
    }
};
