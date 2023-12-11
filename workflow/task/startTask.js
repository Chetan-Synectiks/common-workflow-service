exports.startTask = async (event) => {
    const requestBody = JSON.parse(event.body);
    const { task_id, start_date } = requestBody;
    const { resource_id } = event.queryStringParameters;

    const { Client } = require('pg');
    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
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
        await client.connect();

        const startingtask = `
            UPDATE tasks_table AS t
            SET task = jsonb_set(
                jsonb_set(t.task, '{start_date}', '"${start_date}"'),
                '{status}', '"InProgress"'
            )
            FROM resources_table AS r
            WHERE
                t.id = '${task_id}'
                AND t.assignee_id = '${resource_id}'
                AND r.id = '${resource_id}'
        `;

        await client.query(startingtask);

        const updateResource = `
            UPDATE resources_table
            SET resource = jsonb_set(
                resource, '{current_task}',
                jsonb_build_object('task_id', '${task_id}', 'task_name', t.task->>'name')
            )
            FROM tasks_table AS t
            WHERE
                t.id = '${task_id}'
                AND t.assignee_id = '${resource_id}'
                AND resources_table.id = '${resource_id}'
        `;

        await client.query(updateResource);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Task started" })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error while starting task " })
        };
    } finally {
        await client.end();
    }
};