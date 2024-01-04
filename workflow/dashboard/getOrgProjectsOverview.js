const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event, context, callback) => {
const client = await connectToDatabase();
	try {
		const projectByStatusQuery = `
            SELECT
                COUNT(DISTINCT projects_table.id) AS total_projects,
                COUNT(DISTINCT tasks_table.id) AS total_tasks,
                COUNT(DISTINCT CASE WHEN projects_table.project->>'status' = 'completed' THEN projects_table.id END) AS completed,
                COUNT(DISTINCT CASE WHEN projects_table.project->>'status' = 'inprogress' THEN projects_table.id END) AS in_progress,
                COUNT(DISTINCT CASE WHEN projects_table.project->>'status' = 'unassigned' THEN projects_table.id END) AS unassigned
            FROM projects_table
            LEFT JOIN tasks_table ON projects_table.id = tasks_table.project_id
        `;

        const projectByStatusResult = await client.query(projectByStatusQuery);

        const total_projects = projectByStatusResult.rows[0].total_projects;
        const total_tasks = projectByStatusResult.rows[0].total_tasks;
        const completed = projectByStatusResult.rows[0].completed;
        const in_progress = projectByStatusResult.rows[0].in_progress;
        const unassigned = projectByStatusResult.rows[0].unassigned;

        const percentage_completed = Math.round((completed/total_projects)*100);

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				total_projects : total_projects,
                total_tasks: total_tasks,
                percentage_completed: percentage_completed,
                completed: projects_by_status.completed || 0,
                in_progress: projects_by_status.inprogress|| 0,
                unassigned: projects_by_status.unassigned || 0
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Internal Server Error",
				error: error.message,
			}),
		};
	} finally {
		await client.end();
	}
};
