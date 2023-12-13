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
        const deleteStageQuery = `
            UPDATE usecases_table
            SET usecase = usecase || '{"workflow": {"requirement": null}}'::jsonb
            WHERE id = $1
        `;

        const result = await client.query(deleteStageQuery, [usecase_id]);

        if (result.rowCount > 0) {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ message: "Stage deleted successfully" })
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Usecase not found" })
            };
        }
    } catch (error) {
        console.error("Error deleting stage:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error deleting stage" })
        };
    } finally {
        await client.end();
    }
};