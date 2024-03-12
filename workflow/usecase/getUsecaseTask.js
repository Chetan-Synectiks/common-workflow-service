const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const usecase_id = event.pathParameters?.id;

    const uuidSchema = z.string().uuid({ message: "Invalid Usecase Id" });
    const isUuid = uuidSchema.safeParse(usecase_id);

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
            SELECT 
                t.id AS task_id,
                t.task->>'name' AS task_name,
                t.task->>'status' AS status,
                t.assignee_id,
                e.image,
                CONCAT(e.first_name, ' ', e.last_name) AS assignee_name,
                edd.designation AS assignee_designation,
                md.doc_name,
                md.id AS doc_id,
                md.doc_url,
                md.created_time
            FROM tasks_table t
            LEFT JOIN employee e ON t.assignee_id = e.id
            LEFT JOIN emp_detail ed ON e.id = ed.emp_id
            LEFT JOIN emp_designation edd ON edd.id = ed.designation_id
            LEFT JOIN metadocs_table md ON t.id = md.tasks_id
            WHERE t.usecase_id = $1;
        `;

        const result = await client.query(query, [usecase_id]);

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    error: "No tasks found for the given use case id",
                }),
            };
        }

        // Reorganize the response to group document details under a 'docs' array for each task
        const tasksWithDocs = result.rows.map(row => {
            return {
                task_id: row.task_id,
                task_name: row.task_name,
                status: row.status,
                assignee_id: row.assignee_id || "",
                image: row.image || "",
                assignee_name: row.assignee_name || "",
                assignee_designation: row.assignee_designation || "",
                docs: result.rows
                    .filter(doc => doc.task_id === row.task_id)
                    .map(doc => ({
                        doc_name: doc.doc_name,
                        doc_id: doc.doc_id,
                        doc_url: doc.doc_url,
                        created_time: doc.created_time
                    }))
            };
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ tasks: tasksWithDocs }),
        };
    } catch (error) {
        console.error("Error executing query:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message,
            }),
        };
    } finally {
        await client.end();
    }
};
