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
        
        const queryTotalProjects = "SELECT COUNT(*) FROM projects_table;";
        const resultTotalProjects = await client.query(queryTotalProjects);

        const queryCompletedProjects = "SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'completed';";
        const resultCompletedProjects = await client.query(queryCompletedProjects);

        const queryInProgressProjects = "SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'inprogress';";
        const resultInProgressProjects = await client.query(queryInProgressProjects);

        const queryUnassignProjects = "SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'unassigned';";
        const resultUnassignProjects = await client.query(queryUnassignProjects);

        return {
            statusCode: 200,
            body: JSON.stringify({
                //totalProjects: resultTotalProjects.rows[0].count,
                completedProjects: resultCompletedProjects.rows[0].count,
                inProgressProjects: resultInProgressProjects.rows[0].count,
                unassignedProjects: resultUnassignProjects.rows[0].count,
                //message: "Success"
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message
            })
        };
    } finally {
        await client.end();
    }
};