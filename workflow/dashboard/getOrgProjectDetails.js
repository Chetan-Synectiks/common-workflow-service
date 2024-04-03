const { connectToDatabase } = require("../db/dbConnector");
const middy = require("@middy/core");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");

const totalProjectsQuery = `
            SELECT
                COUNT(*) AS total_projects
            FROM
                projects_table
            WHERE
                org_id = $1`;
			
const totalTasksQuery = `
            SELECT
                COUNT(DISTINCT id) AS task_count
            FROM
                tasks_table`;

const projectByStatusQuery = `
            SELECT 
                COUNT(*) AS count,
                (project->>'status') AS status
            FROM
                projects_table
            WHERE
                org_id = $1
            GROUP BY
                project->>'status'`;

exports.handler = middy(async (event, context, callback) => {
    const org_id = event.user["custom:org_id"];
	const client = await connectToDatabase();

	const total_projects_result = await client.query(totalProjectsQuery,[org_id]);
	const total_projects = total_projects_result.rows[0].total_projects;

	const total_tasks_result = await client.query(totalTasksQuery);
	const total_tasks = total_tasks_result.rows[0].task_count;

const projectByStatusResult = await client.query(projectByStatusQuery,[org_id]);

	const projects_by_status = {};
	projectByStatusResult.rows.forEach((row) => {
		const status = row.status;
		const count = row.count;
		projects_by_status[status] = parseInt(count);
	});

	const percentage_completed = Math.round(
		(projects_by_status.completed / total_projects) * 100
	);

	await client.end();

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify({
			total_projects: parseInt(total_projects),
			total_tasks: parseInt(total_tasks),
			percentage_completed: isNaN(percentage_completed)
				? 0
				: percentage_completed,
			completed: projects_by_status.completed || 0,
			in_progress: projects_by_status.inprogress || 0,
			unassigned: projects_by_status.unassigned || 0,
		}),
	};
})
	.use(authorize())
	.use(errorHandler());
