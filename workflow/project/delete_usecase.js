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
             // Assuming event.querySTringParameters.usecase_id contains the usecase_id
    const usecase_id = event.queryStringParameters.usecase_id;
 
    const query = `
        DELETE FROM usecases_table
        WHERE usecase->>'id' = $1
        RETURNING *;
    `;
 
    const result = await client.query(query, [usecase_id]);
 
    // Process the result or return it as a response
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Use case deleted successfully' }),
    };
} catch (error) {
    console.error('Error executing query:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
    };
} finally {
    await client.end();
}
};