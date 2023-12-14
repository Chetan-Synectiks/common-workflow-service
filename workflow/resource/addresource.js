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
    const body = JSON.parse(event.body);
    try {
        await client
        .connect()
        .then(() => {
            console.log("Connected to the database");
        })
        .catch((err) => {
            console.log("Error connecting to the database. Error :" + err);
        });

        await client.query(`INSERT INTO resources_table (resource) VALUES ($1)`,[body]);
       
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "Successfully resource details inserted " })
        };
    } catch (error) {
        console.error("Error: ", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    } finally {
        await client.end();
    }
};
