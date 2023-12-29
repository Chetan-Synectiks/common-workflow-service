const {connectToDatabase} = require('../db/dbConnector')

exports.handler = async (event) => {
    const projectId = event.queryStringParameters?.project_id?? null;
    if (projectId == null || projectId === "") {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "ProjectId id is required",
			}),
		};
	}
    const client = await connectToDatabase()
    try {
        const useCaseDetailsResult = await client.query(`
                SELECT
                u.id AS usecase_id,
                u.usecase->>'name' AS name,
                u.usecase->>'current_stage' AS currentstage,
                u.usecase->>'start_date' AS usecase_startdate,
                u.usecase->>'end_date' AS usecase_enddate,
                u.usecase->>'usecase_assignee_id' AS assignedid,
                COUNT(DISTINCT t.assignee_id) + 1 AS totalresources
            FROM usecases_table u
            LEFT JOIN tasks_table t ON u.id = t.usecase_id
            JOIN projects_table p ON u.project_id = p.id
            WHERE p.id = $1
            GROUP BY u.id
        `, [projectId]);

        const useCaseDetails = useCaseDetailsResult.rows.map(row => ({
            usecase_id: row.usecase_id,
            usecase_name: row.name,
            current_stage: row.currentstage,
            usecase_assigned_id: row.assignedid,
            total_resources: row.totalresources,
            start_date: row.usecase_startdate,
            end_date: row.usecase_enddate,
        }));
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(useCaseDetails)
        };
    } catch (e) {
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