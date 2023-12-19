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
	const resourceId = event.queryStringParameters?.resource_id ?? null;
	const fromDate = event.queryStringParameters?.from_date ?? null;
	const toDate = event.queryStringParameters?.to_date ?? null;
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
		const queryParams = [];
		if (fromDate !== null && toDate !== null) {
			queryParams.push(fromDate);
			queryParams.push(toDate);
		} else {
			const dates = getDates();
			queryParams.push(dates.thirtyDaysAgo);
			queryParams.push(dates.currentDate);
		}
		if (resourceId !== null) {
			query += `
                    WHERE
                        r.id = $3`;
			queryParams.push(resourceId);
		}
		query += `
                    AND (t.task->>'start_date') <> ''
                    AND (t.task->>'end_date') <> ''
                    AND (t.task->>'start_date')::date >= $1::date
                    AND (t.task->>'end_date')::date <= $2::date
                    GROUP BY
                        r.id`;
		const result = await client.query(query, queryParams);
		const resourcetasks = result.rows.map(
			({
				resource_id,
				resource_name,
				completed,
				inprogress,
				pending,
			}) => ({
				resource_id,
				resource_name,
				completed_tasks: completed,
				inprogress_tasks: inprogress,
				pending_tasks: pending,
			})
		);
		/*
			When the array is empty. It means that no tasks were assigned between
			the last 1 month or betweeen the specified dates.
		*/
		// if (resourcetasks.length === 0) {
		// 	return {
		// 		statusCode: 200,
		// 		headers: {
		// 			"Access-Control-Allow-Origin": "*",
		// 		},
		// 		body: JSON.stringify({
		// 			response: "no tasks assigned",
		// 		}),
		// 	};
		// }
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

function getDates() {
	const currentDate = new Date();
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(currentDate.getDate() - 30);
	return {
		currentDate: currentDate.toISOString().split("T")[0],
		thirtyDaysAgo: thirtyDaysAgo.toISOString().split("T")[0],
	};
}
