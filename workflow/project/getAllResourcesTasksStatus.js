exports.getAllResourcesTasksStatus = async (event, context, callback) => {
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
        message: "Project search successful",
        type: "object",
        object: []
    };

    try {
        // Fetch use cases from the database
        const usecaseResult = await client.query(`
            SELECT usecase
            FROM usecase_table`
            
        );

        let assigneeTasks = {};

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
                            task.end_date <= data.to_date
                        ) {
                            // Fetch resource information for each assignee_id
                            const resourceResult = await client.query(`
                                SELECT resource->>'name' AS name
                                FROM resource_table
                                WHERE id = $1`,
                                [assigneeId]
                            );

                            const resourceName = resourceResult.rows[0].name;

                            if (!assigneeTasks[assigneeId]) {
                                assigneeTasks[assigneeId] = {
                                    resource_id: assigneeId,
                                    resource_name: resourceName,
                                    completed_tasks: 0,
                                    inprogress_tasks: 0,
                                    pending_tasks: 0
                                };
                            }

                            if (task.status === 'inprogress') {
                                assigneeTasks[assigneeId].inprogress_tasks++;
                            } else if (task.status === 'completed') {
                                assigneeTasks[assigneeId].completed_tasks++;
                            } else if (task.status === 'pending') {
                                assigneeTasks[assigneeId].pending_tasks++;
                            }
                        }
                    }
                }
            }
        }

        // Convert the assigneeTasks object to an array of values
        const assigneeTasksArray = Object.values(assigneeTasks);

        await client.end();

        // Return the response
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                code: 200,
                message: "Project search successful",
                type: "object",
                object: assigneeTasksArray
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
