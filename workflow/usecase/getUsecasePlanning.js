const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const usecaseId = event.pathParameters?.id ?? null;
    const usecaseIdSchema = z.string().uuid({ message: "Invalid usecase id" });
    const isUuid = usecaseIdSchema.safeParse(usecaseId);
    if (!isUuid.success) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: isUuid.error.issues[0].message,
            }),
        };
    }
    const client = await connectToDatabase();
    try {
        const query = `
            SELECT u.usecase,
                   t.id AS id,
                   t.task->>'name' AS task_name,
                   t.task->>'stage' AS stage_name,
                   t.task->>'assign_id' AS assignee_id,
                   t.task->>'description' AS description,
                   t.task->>'start_date' AS task_start_date,
                   t.task->>'end_date' AS task_end_date,
                   t.task->>'resource_start_date' AS resource_start_date,
                   t.task->>'resource_end_date' AS resource_end_date
            FROM usecases_table u
                   JOIN tasks_table t ON u.id = t.usecase_id
             WHERE u.id = $1
        `;

        const jsonData = await client.query(query, [usecaseId]);
        const usecaseData = jsonData.rows[0];
        console.log(usecaseData);
        const stageDetails = usecaseData.usecase.stages.map((stage) => {
            const stageName = Object.keys(stage)[0];
            const matchingTaskDetails = jsonData.rows
                .filter((row) => row.stage_name === stageName)
                .map((row) => {
                    const taskStartDate = new Date(row.task_start_date);
                    const resourceStartDate = new Date(row.resource_start_date);
                    const taskEndDate = new Date(row.task_end_date);
                    const resourceEndDate = new Date(row.resource_end_date);
                    const startDeviationInMilliseconds =
                        taskStartDate - resourceStartDate;
                    const endDeviationInMilliseconds =
                        taskEndDate - resourceEndDate;

                    const startDeviationInDays = Math.abs(
                        startDeviationInMilliseconds / (24 * 60 * 60 * 1000)
                    );
                    const endDeviationInDays = Math.abs(
                        endDeviationInMilliseconds / (24 * 60 * 60 * 1000)
                    );
                    return {
                        id: row.id,
                        name: row.task_name,
                        assignee_id:
                            row.assignee_id !== null ? row.assignee_id : "",
                        start_date: row.task_start_date,
                        end_date: row.task_end_date,
                        resource_start_date: row.resource_start_date,
                        resource_end_date: row.resource_end_date,
                        start_deviation: startDeviationInDays || 0,
                        end_deviation: endDeviationInDays || 0,
                    };
                });

            return {
                [stageName]: {
                    task_details: matchingTaskDetails,
                },
            };
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(stageDetails),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: error.message,
                error: error,
            }),
        };
    } finally {
        await client.end();
    }
};