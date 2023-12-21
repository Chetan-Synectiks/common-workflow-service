const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const name = event.pathParameters?.name ?? null;
	const projectId = event.queryStringParameters?.project_id ?? null;
	if (projectId == null || projectId === '') {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Project id is required",
			}),
		};
	}
	if (name == null || name === '') {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify([]),
		};
	}
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
	await client
		.connect()
		.then(() => {
			console.log("Connected to the database");
		})
		.catch((err) => {
			console.log("Error connecting to the database. Error :" + err);
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Internal server error : " + err.message,
				}),
			};
		});
	try {
		const result = await client.query(`
                        SELECT
                        u.id AS usecase_id,
                        u.usecase->>'name' AS name,
                        u.usecase->>'current_stage' AS current_stage,
                        u.usecase->>'start_date' AS start_date,
                        u.usecase->>'end_date' AS end_date,
                        u.usecase->>'usecase_assignee_id' AS usecase_assigned_id,
                        COUNT(DISTINCT t.assignee_id) AS total_resources
                    FROM
                        usecases_table AS u
                    LEFT JOIN
                        tasks_table AS t ON u.id = t.usecase_id
                    WHERE
                        u.project_id = $1 AND LOWER(u.usecase->>'name') ILIKE LOWER('%' || $2 || '%')
                    GROUP BY
                        u.id;`,
			[projectId, name]
		);

		const useCaseDetails = result.rows.map(
			({
				usecase_id,
				name,
				current_stage,
				start_date,
				end_date,
				usecase_assigned_id,
				total_resources,
			}) => ({
				usecase_id,
				name,
				current_stage,
				start_date,
				end_date,
				usecase_assigned_id,
				total_resources,
			})
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(useCaseDetails),
		};
	} catch (e) {
		await client.end();
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: e.message || "Internal server error",
			}),
		};
	}
};
