const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event, context, callback) => {
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

	const projectId = event.queryStringParameters?.project_id ?? null;
	try {
		await client
			.connect()
			.then(() => {
				console.log("Connected to the database");
			})
			.catch((err) => {
				console.log("Error connecting to the database. Error :" + err);
			});
		let query = `
					SELECT
						p.id AS project_id,
						(p.project->>'name') AS project_name,
						COUNT(u.id) AS usecase_count,
						COUNT(*) FILTER (WHERE u.usecase->>'status' = 'completed') AS completed
					FROM
						projects_table AS p
					LEFT JOIN
						usecases_table AS u ON p.id = u.project_id`;
		const queryParams = [];
		if (projectId !== null) {
			query += `
					WHERE
						p.id = $1`;
			queryParams.push(projectId);
		}
		query += `
					GROUP BY
						p.id`;
		const result = await client.query(query, queryParams);

		const usecaseOverview = result.rows.map(
			({ project_id, project_name, usecase_count, completed }) => ({
				project_id,
				project_name,
				completed,
				incomplete: usecase_count - completed,
			})
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(Object.values(usecaseOverview)),
		};
	} catch (e) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ error: e.message || "An error occurred" }),
		};
	} finally {
		client.end();
	}
};
