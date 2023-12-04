exports.getProjectsUsecases = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflowapi", // Replace with your actual database name
        user: "postgres",     // Replace with your actual database user
        password: "" // Replace with your actual database password
    });

    client.connect();

    try {
        // Fetch use case details and related tasks
        const useCaseDetailsResult = await client.query(`
            SELECT
                u.id AS usecase_id,
                u.usecase->>'name' AS name,
                u.usecase->>'current_stage' AS currentstage,
                u.usecase->>'start_date' AS usecase_startdate,
                u.usecase->>'end_date' AS usecase_enddate,
                u.usecase->>'usecase_assignee_id' AS assignedid,
                COUNT(DISTINCT t.assignee_id) AS totalresources
            FROM usecases_table u
            LEFT JOIN tasks_table t ON u.id = t.usecase_id
            GROUP BY u.id
        `);

        const useCaseDetails = useCaseDetailsResult.rows.map(row => ({
            usecase_id: row.usecase_id,
            usecase_name: row.name,
            current_stage: row.currentstage,
            usecase_assigned_id: row.assignedid,
            total_resources: row.totalresources,
            start_date: row.usecase_startdate,
            end_date: row.usecase_enddate,
        }));

        await client.end();

        // Return the response without code, message, and type
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(useCaseDetails)
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