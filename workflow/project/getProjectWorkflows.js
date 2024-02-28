const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const project_id =event.pathParameters?.id ?? null;
    const projectIdSchema = z.string().uuid({message : "Invalid project id"})
    const isUuid = projectIdSchema.safeParse(project_id)
	if(!isUuid.success){
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: isUuid.error.issues[0].message
			}),
		};
	}
    const client = await connectToDatabase();
    try {

        const usecasesQuery = `
            SELECT
                w.id AS workflow_id,
                w.name AS workflow_name,
                COUNT(DISTINCT u.id) AS total_usecases,
                COUNT(t.id) AS total_tasks,
                COUNT(t.id) FILTER (WHERE (t.task ->> 'status') = 'completed') AS task_completed,
                COUNT(DISTINCT CASE WHEN (u.usecase ->> 'status') = 'completed' THEN u.id ELSE NULL END) AS completed_usecases
            FROM workflows_table w
            LEFT JOIN usecases_table u ON w.id = u.workflow_id
            LEFT JOIN tasks_table t ON u.id = t.usecase_id AND t.project_id = u.project_id
            WHERE u.project_id = $1
            GROUP BY w.id, w.name
        `;

        const usecasesResult = await client.query(usecasesQuery, [project_id]);
        const workflows = usecasesResult.rows.map(row => ({
            workflow_id: row.workflow_id,
            workflow_name: row.workflow_name,
            total_usecases: row.total_usecases,
            task_completed: calculatePercentage(row.total_tasks, row.task_completed),
            completed_usecases: row.completed_usecases
        }));

        return {
            statusCode: 200,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify(workflows),
        };
    } catch (error) {   
        console.error(error);
        
        return {
            statusCode: 500,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};

function calculatePercentage(total, completed) {
    return total === 0 ? 0 : (completed / total) * 100;
}
