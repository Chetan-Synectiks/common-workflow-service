const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
	const status = event.queryStringParameters?.project_status ?? null;
	if (!status) {
		return {
			statuscode: 400,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			body: JSON.stringify({message:"Give status of project "}),
		};
	}
	const client = await connectToDatabase();
	try {
		let query = `
					SELECT 
					p.id AS project_id,
					(p.project->>'name') AS project_name,
					(p.project->>'status') AS status,
					(p.project->>'end_date') AS due_date,
					COUNT(DISTINCT u.id) AS total_usecases,
					COUNT(DISTINCT CASE WHEN u.usecase->>'status' = 'completed' THEN u.id END) AS completed_usecases,
					COUNT(DISTINCT t.id) AS total_tasks,
					COUNT(t.id) FILTER (WHERE t.task->>'status' = 'completed') as tasks_completed,
					COUNT(DISTINCT CASE WHEN t.task->>'status' = 'completed' THEN t.id END) AS completed_tasks
				FROM projects_table AS p 
				LEFT JOIN usecases_table AS u ON p.id = u.project_id 
				LEFT JOIN tasks_table AS t ON u.id = t.usecase_id AND p.id = t.project_id`;
         const queryParams = []
		if (status !== null) {
			query += `
                    where
                        (p.project->>'status' = $1)`;
                        queryParams.push(status)
		}
		query += `
                    group by 
                        p.id`;
		const result = await client.query(query, queryParams);
		const projectsOverview = result.rows.map(
			({
				project_id,
				project_name,
				status,
				due_date,
				total_usecases,
                completed_usecases,
				total_tasks,
				tasks_completed,
			}) => ({
				project_id,
				project_name,
				status,
                total_usecases,
                completed_usecases,
				due_date,
				completed_tasks_percentage: (total_tasks != 0) ? Math.round((tasks_completed / total_tasks) * 100) : 0
			})
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(projectsOverview),
		};
	} catch (error) {
		console.error("Error executing query:", error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Internal Server Error" }),
		};
	} finally {
		await client.end();
	}
};
