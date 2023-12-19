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

	const resource_id = event.queryStringParameters?.resource_id;
	const task_id = event.pathParameters?.task_id;
	try {
		if (!resource_id || !task_id ) {
            return {
                statuscode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({message:"Give values"}),
            };
        }
		await client
			.connect()
			.then(() => {
				console.log("Connected to the database");
			})
			.catch((err) => {
				console.log("Error connecting to the database. Error :" + err);
			});

		const taskDetailsQuery = `
                SELECT
                task AS task
                FROM tasks_table 
                WHERE id = $1`;

		const result = await client.query(taskDetailsQuery, [task_id]);
		const task = result.rows[0].task;
		task.status = "in progress";
		task.resource_start_date = new Date();
		await client.query("BEGIN");
		const taskUpdateQuery = `
            UPDATE tasks_table
            SET task = $1
            WHERE id = $2
            `;
		const updateResult = await client.query(taskUpdateQuery, [
			task,
			task_id,
		]);
		if (updateResult.rowCount === 0) {
			await client.query("ROLLBACK");
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({ message: "Unable to start task" }),
			};
		}
		const current_task = {
			task_id: task_id,
			task_name: task.name,
		};
		const updateCurrentTaskQuery = `
                    UPDATE resources_table
                    SET resource = jsonb_set(
                        resource,
                        '{current_task}',
                        $1::jsonb,
                        true
                    )
                    WHERE id = $2`;
		const updateCurrentTaskResult = await client.query(
			updateCurrentTaskQuery,
			[current_task, resource_id]
		);
		if (updateCurrentTaskResult.rowCount === 0) {
			await client.query("ROLLBACK");
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Unable to update current task",
				}),
			};
		}
		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Task started" }),
		};
	} catch (error) {
		console.error("error", error);
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Error while starting task " }),
		};
	} finally {
		await client.end();
	}
};