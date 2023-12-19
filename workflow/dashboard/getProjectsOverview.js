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

		const status = event.queryStringParameters?.project_status ?? null;

		let query = `
                    select 
                        p.id as project_id,
                        (p.project->>'name') as project_name,
                        (p.project->>'status') as status,
                        (p.project->>'end_date') as due_date,
                        COUNT(distinct u.id) as total_usecases,
                        COUNT(t.id) as total_tasks,
                        COUNT(t.id) FILTER (WHERE t.task->>'status' = 'completed') as tasks_completed
                        from projects_table as p 
                    left join
                        usecases_table as u on p.id = u.project_id 
                    left join
                        tasks_table as t on u.id = t.usecase_id and p.id = t.project_id
                    `;
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
				total_tasks,
				tasks_completed,
			}) => ({
				project_id,
				project_name,
				status,
				due_date,
				total_usecases,
				completed_tasks_per: (total_tasks !== 0) ? (tasks_completed / total_tasks) * 100 : 0
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
