const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const secretsManagerClient = new SecretsManagerClient({
		region: "us-east-1",
	});
	const configuration = await secretsManagerClient.send(
		new GetSecretValueCommand({ SecretId: "serverless/lambda/credintials" })
	);
	const dbConfig = JSON.parse(configuration.SecretString);

	const client = new Client({
		host: dbConfig.host,
		port: dbConfig.port,
		database: "workflow",
		user: dbConfig.engine,
		password: dbConfig.password,
	});
	try {
		await client
			.connect()
			.then(() => {
				console.log("Connected to the database");
			})
			.catch((err) => {
				console.log("Error connecting to the database. Error :" + err);
			});

		const total_projects_result = await client.query(`SELECT
                                                        COUNT(*) AS total_projects
                                                        FROM projects_table`);
		const total_projects = total_projects_result.rows[0].total_projects;
        const total_tasks_result = await client.query(`
                                                SELECT
                                                    COUNT(tasks.id) AS task_count
                                                FROM
                                                    projects_table AS projects
                                                LEFT JOIN
                                                    tasks_table AS tasks ON projects.id = tasks.project_id`);
        const total_tasks = total_tasks_result.rows[0].task_count;
		const projectByStatusQuery = `select 
                                      count(*) as count,
                                      (project->>'status') as status
                                      from projects_table
                                      GROUP BY
                                      project->>'status'`;

		const projectByStatusResult = await client.query(projectByStatusQuery);
		const projects_by_status = {};
		projectByStatusResult.rows.forEach((row) => {
			const status = row.status;
			const count = row.count;
			projects_by_status[status] = count;
		});
        console.log(projects_by_status)
        const percentage_completed = Math.round((projects_by_status.completed/total_projects)*100);
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
