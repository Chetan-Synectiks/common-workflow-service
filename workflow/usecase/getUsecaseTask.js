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
        t.id as task_id,
        t.task->>'name' AS task_name,
        t.task->>'status' AS status,
        t.assignee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS assignee_name,
        e.image AS assignee_image,
        edd.designation AS assignee_designation,
        json_agg(json_build_object('id', d.id, 'name', d.doc_name, 'doc_url', d.doc_url, 'created_time', d.created_time)) AS docs
    FROM
        tasks_table t
    LEFT JOIN
        metadocs_table d ON d.tasks_id = t.id
    LEFT JOIN
        employee e ON t.assignee_id = e.id
    LEFT JOIN   
        emp_detail ed ON e.id = ed.emp_id
    LEFT JOIN
        emp_designation edd ON edd.id = ed.designation_id
    WHERE
        t.usecase_id = $1
    GROUP BY
        t.id, t.task, t.assignee_id, CONCAT(e.first_name, ' ', e.last_name), e.image, edd.designation, d.id, ed.id;
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

        const tasksWithDocs = result.rows.map(row => {
            return {
                task_id: row.task_id,
                task_name: row.task_name,
                status: row.status,
                assignee_id: row.assignee_id || "",
                image: row.image || "",
                assignee_name: row.assignee_name || "",
                assignee_designation: row.assignee_designation || "",
                docs: row.docs.map(doc => ({
                    doc_name: doc.name,
                    doc_id: doc.id,
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
