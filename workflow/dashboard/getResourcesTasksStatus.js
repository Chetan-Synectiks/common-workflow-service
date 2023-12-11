const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.getResourcesTasksStatus = async (event) => {
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

    client.connect();

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    };

    try {

        await client
		.connect()
		.then(() => {
			console.log("Connected to the database");
		})
		.catch((err) => {
			console.log("Error connecting to the database. Error :" + err);
		});
        // Fetch tasks and resource information using JOIN
        const tasksResult = await client.query(`
            SELECT t.*, r.resource->>'name' AS resource_name
            FROM tasks_table t
            INNER JOIN resources_table r ON t.assignee_id = r.id
            WHERE t.assignee_id = $1`,
            [data.resource_id]
        );

        let resourceTasks = {
            completed_tasks: 0,
            inprogress_tasks: 0,
            pending_tasks: 0
        };

        // Process each task
        for (const taskRow of tasksResult.rows) {
            const task = taskRow.task;

            // Filter tasks based on date range
            if (
                task.start_date >= data.from_date &&
                task.end_date <= data.to_date
            ) {
                if (task.status === 'In Progress') {
                    resourceTasks.inprogress_tasks++;
                } else if (task.status === 'Completed') {
                    resourceTasks.completed_tasks++;
                } else if (task.status === 'Pending') {
                    resourceTasks.pending_tasks++;
                }
            }
        }

        await client.end();

        // Return the response
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(resourceTasks)
        };
    } catch (e) {
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                error: e.message || "An error occurred"
            })
        };
    }
};
