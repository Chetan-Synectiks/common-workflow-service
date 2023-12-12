const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.deleteProject = async (event) => {
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
    const { project_id } = event.queryStringParameters;
    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });
        const deleteUsecasesQuery = `
            DELETE FROM usecases_table
            WHERE project_id = '${project_id}'
        `;
        const deleteTasksQuery = `
            DELETE FROM tasks_table
            WHERE project_id = '${project_id}'
        `;
        const deleteProjectQuery = `
            DELETE FROM projects_table
            WHERE id = '${project_id}'
        `;
        await client.query(deleteTasksQuery);
        await client.query(deleteUsecasesQuery);
        await client.query(deleteProjectQuery);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "Project and associated records deleted successfully" })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "Error while deleting project and associated records" })
        };
    } finally {
        await client.end();
    }
};
