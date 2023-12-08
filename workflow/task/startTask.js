exports.startTask = async (event) => {
    const params = event.queryStringParameters;
    const requestBody = JSON.parse(event.body);

    const { resource_id } = params;
    const { task_id, start_date } = requestBody;

    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "password"
    });

    try {
        await client.connect();

        await client.query(`
        UPDATE task_table
        SET task = jsonb_set(
            jsonb_set(task, '{start_date}', '"${start_date}"'),
            '{status}', '"Incomplete"'
        )
        WHERE id = '${task_id}' AND assigne_id = '${resource_id}'`);


        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Task started " })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error while starting task" })
        };
    } finally {
        await client.end();
    }
};