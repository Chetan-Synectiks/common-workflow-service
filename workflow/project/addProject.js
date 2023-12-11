exports.addProject = async (event) => {
    const requestBody = JSON.parse(event.body);

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

    try {
        await client.connect();

        const result = await client.query(
            'INSERT INTO projects_table (project) VALUES ($1::jsonb) RETURNING id as project_id, (project->>\'project_name\')::text as project_name',[requestBody]
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
