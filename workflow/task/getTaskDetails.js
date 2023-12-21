const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const resource_id = event.queryStringParameters?.resource_id ?? null;
	if ( resource_id== null ) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: "The 'resource_id' query parameters are required and must have a non-empty value."
            }),
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

	try {
		await client
			.connect()
			.then(() => {
				console.log("Connected to the database");
			})
			.catch((err) => {
				console.log("Error connecting to the database. Error :" + err);
			});

		const query = `
                    SELECT * 
                    FROM tasks_table 
                    WHERE assignee_id = $1`;

		const result = await client.query(query, [resource_id]);

		if (result.rowCount === 0) {
			return {
				statusCode: 204,
				body: JSON.stringify({
					message: "No tasks present",
				}),
			};
		}

		const tasksList = result.rows.map(async (row) => {
			const projectResult = await client.query(
				`SELECT
                (project->'name') AS name
                FROM projects_table WHERE id = $1`,
				[row.project_id]
			);
			const projectName = projectResult.rows[0].name;

			const assignedBy = await client.query(
				`SELECT
                (resource->'name') AS name
                FROM resources_table WHERE id = $1`,
				[row.task.assigned_by_id]
			);

			return {
				task_id: row.id,
				task_name: row.task.name,
				project_id: row.project_id,
				project_name: projectName,
				assigned_by_id: row.task.assigned_by_id,
				assigned_by_name: assignedBy.rows[0].name,
				task_assigned_date: row.task.task_assigned_date,
			};
		});

		const resolvedTasksList = await Promise.all(tasksList);

		return {
			statusCode: 200,
			body: JSON.stringify(resolvedTasksList),
		};
	} catch (error) {
		console.error("Error executing query:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Internal Server Error" }),
		};
	} finally {
		await client.end();
	}
};
