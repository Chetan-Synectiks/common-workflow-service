exports.getResourcesTasksStatus = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: ""
    });

    client.connect();

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    let objReturn = {
        code: 200,
        message: "Resource search successful",
        type: "object",
        object: []
    };

    try {
        // Fetch resource information for the specified resource_id
        const resourceResult = await client.query(`
            SELECT resource->>'name' AS name
            FROM resource_table
            WHERE id = $1`,
            [data.resource_id]
        );

        const resourceName = resourceResult.rows[0].name;

        let resourceTasks = {
            resource_id: data.resource_id,
            resource_name: resourceName,
            completed_tasks: 0,
            inprogress_tasks: 0,
            pending_tasks: 0
        };

        // Fetch use cases from the database
        const usecaseResult = await client.query(`
            SELECT usecase
            FROM usecase_table`
        );

        // Process each use case
        for (const usecaseRow of usecaseResult.rows) {
            const usecase = usecaseRow.usecase;

            // Process each stage in the use case
            for (const stageKey in usecase.stages) {
                const stage = usecase.stages[stageKey];

                // Process each task in the stage
                if (stage.tasks) {
                    for (const task of stage.tasks) {
                        const assigneeId = task.assignee_id;

                        // Compare start_date and end_date of tasks
                        if (
                            task.start_date >= data.from_date &&
                            task.end_date <= data.to_date &&
                            assigneeId === data.resource_id
                        ) {
                            if (task.status === 'inprogress') {
                                resourceTasks.inprogress_tasks++;
                            } else if (task.status === 'completed') {
                                resourceTasks.completed_tasks++;
                            } else if (task.status === 'pending') {
                                resourceTasks.pending_tasks++;
                            }
                        }
                    }
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
            body: JSON.stringify({
                code: 200,
                message: "Resource search successful",
                type: "object",
                object: [resourceTasks]
            })
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    }
};
