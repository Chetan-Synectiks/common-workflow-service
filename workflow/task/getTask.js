const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
    const id = event.pathParameters?.id;
    if (!id) {
        return {
            statusCode: 400,  
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Bad request' }),
        };
    }
    const client = await connectToDatabase();
    try {
        const query = `
            SELECT 
            id,
            task
            FROM tasks_table
            WHERE id = $1
        `;
        const tasksResult = await client.query(query, [id]);
        if (tasksResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ error: 'Task not found' }),
            };
        }
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                id: tasksResult.rows[0].id,
                status: tasksResult.rows[0].task.status,
                end_date: tasksResult.rows[0].task.end_date,
                start_date: tasksResult.rows[0].task.start_date,
                created_date: tasksResult.rows[0].task.created_date,
                resource_end_date: tasksResult.rows[0].task.resource_end_date,
                resource_start_date: tasksResult.rows[0].task.resource_start_date,
            }),
        };
    } catch (error) {
        console.error("Error executing query:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    } finally {
        await client.end();
    }
};