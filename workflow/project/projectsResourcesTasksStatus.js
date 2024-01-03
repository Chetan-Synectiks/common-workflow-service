const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
    const projectId = event.queryStringParameters?.project_id;
    if (!projectId) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Missing project_id parameter' }),
        };
    }

    const fromDate = event.queryStringParameters?.from_date ?? null;
    const toDate = event.queryStringParameters?.to_date ?? null;

    try {
        const client = await connectToDatabase();

        let query = `SELECT
                        r.id AS resource_id,
                        (r.resource->>'name') AS resource_name,
                        COUNT(*) FILTER (WHERE t.task->>'status' = 'completed') AS completed,
                        COUNT(*) FILTER (WHERE t.task->>'status' = 'inprogress') AS inprogress,
                        COUNT(*) FILTER (WHERE t.task->>'status' = 'pending') AS pending
                        FROM
                        resources_table AS r
                    LEFT JOIN
                        tasks_table AS t ON r.id = t.assignee_id`;
        const queryParams = [];
        if (fromDate !== null && toDate !== null) {
            queryParams.push(fromDate);
            queryParams.push(toDate);
        } else {
            const dates = getDates();
            queryParams.push(dates.thirtyDaysAgo);
            queryParams.push(dates.currentDate);
        }
        if (projectId !== null) {
            query += `
                    WHERE
                        t.project_id = $3`;
            queryParams.push(projectId);
        }
        query += `
                    AND (t.task->>'start_date') <> ''
                    AND (t.task->>'end_date') <> ''
                    AND (t.task->>'start_date')::date >= $1::date
                    AND (t.task->>'end_date')::date <= $2::date
                    GROUP BY
                        r.id`;
        const result = await client.query(query, queryParams);

        const resourcetasks = result.rows.map(
            ({
                resource_id,
                resource_name,
                completed,
                inprogress,
                pending,
            }) => ({
                resource_id,
                resource_name,
                completed_tasks: completed,
                inprogress_tasks: inprogress,
                pending_tasks: pending,
            })
        );

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(Object.values(resourcetasks)),
        };
    } catch (e) {
        await client.end();
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: e.message || "An error occurred",
            }),
        };
    }
};

function getDates() {
    const currentDate = new Date();
    console.log(currentDate)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    return {
        currentDate: currentDate.toISOString().split("T")[0],
        thirtyDaysAgo: thirtyDaysAgo.toISOString().split("T")[0],
    };
}
