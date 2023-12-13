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
        
        const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects_table");
        const resultTotalProjects = queryTotalProjects.rows[0].count;

       
        const queryCompletedProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'completed'");
        const resultCompletedProjects = queryCompletedProjects.rows[0].count;

        const queryUnassignedProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'unassigned'");
        const resultUnassignedProjects = queryUnassignedProjects.rows[0].count;

        const queryInProgressProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'inprogress'");
        const resultInProgressProjects = queryInProgressProjects.rows[0].count;

        const percentageCompletedProjects = (resultCompletedProjects / resultTotalProjects) * 100;
        const percentageUnassignedProjects = (resultUnassignedProjects / resultTotalProjects) * 100;
        const percentageInProgressProjects = (resultInProgressProjects / resultTotalProjects) * 100;

        const queryTotalTasks = await client.query(`
            SELECT COUNT(*) as total_tasks
            FROM tasks_table t
            JOIN usecases_table u ON t.usecase_id = u.id
        `);

        totaltasks = queryTotalTasks.rows[0].total_tasks;

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                totalProjects: resultTotalProjects,
                totalTasks: totaltasks,
                percentageCompletedProjects: percentageCompletedProjects,
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