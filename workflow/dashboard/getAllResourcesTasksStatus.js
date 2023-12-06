exports.getAllResourcesTasksStatus = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflowapi",
        user: "postgres",
        password: ""
    });

    client.connect();

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    try {
        // Fetch tasks and resource information using JOIN
        const tasksResult = await client.query(`
            SELECT t.*, r.resource->>'name' AS resource_name
            FROM tasks_table t
            INNER JOIN resources_table r ON t.assignee_id = r.id`
        );

        let assigneeTasks = {};

        // Process each task
        for (const taskRow of tasksResult.rows) {
            const assigneeId = taskRow.assignee_id;
            const task = taskRow.task;

            // Filter tasks based on date range
            if (
                task.start_date >= data.from_date &&
                task.end_date <= data.to_date
            ) {
                if (!assigneeTasks[assigneeId]) {
                    assigneeTasks[assigneeId] = {
                        resource_id: assigneeId,
                        resource_name: taskRow.resource_name,
                        completed_tasks: 0,
                        inprogress_tasks: 0,
                        pending_tasks: 0
                    };
                }

                if (task.status === 'In Progress') {
                    assigneeTasks[assigneeId].inprogress_tasks++;
                } else if (task.status === 'Completed') {
                    assigneeTasks[assigneeId].completed_tasks++;
                } else if (task.status === 'Pending') {
                    assigneeTasks[assigneeId].pending_tasks++;
                }
            }
        }

        // Convert the assigneeTasks object to an array of values
        const assigneeTasksArray = Object.values(assigneeTasks);

        await client.end();

        // Return the response without code, message, and type
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(assigneeTasksArray)
        };
    } catch (e) {
        await client.end();

        // Return an error response without code, message, and type
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
