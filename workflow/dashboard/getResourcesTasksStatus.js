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
	const resourceId = event.queryStringParameters && event.queryStringParameters.resource_id;
	try {
		await client
			.connect()
			.then(() => {
				console.log("Connected to the database");
			})
			.catch((err) => {
				console.log("Error connecting to the database. Error :" + err);
			});

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
		if (resourceId !== null) {
			query += `
                    WHERE
                        r.id = '${resourceId}'`;
		}
		    query += `
                    GROUP BY
                        r.id`;
		const result = await client.query(query);

		const resourcetasks = {};
		result.rows.forEach((row) => {
			const resourceId = row.resource_id;
			const resourceName = row.resource_name;
			const completed = row.completed;
			const inprogress = row.inprogress;
			const pending = row.pending;
			resourcetasks[resourceId] = {
				resource_id: resourceId,
				resource_name: resourceName,
				completed_tasks: completed,
				inprogress_tasks: inprogress,
				pending_tasks: pending,
			};
		});
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