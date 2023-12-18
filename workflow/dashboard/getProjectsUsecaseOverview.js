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

	const projectId = event.queryStringParameters && event.queryStringParameters.project_id
	console.log(projectId)
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
		if(projectId !== null){
			query += `
					WHERE
						p.id = '${projectId}'`
		}
			query += `
					GROUP BY
						p.id`;
		const result = await client.query(query);

		const usecase_overview = {};

		result.rows.forEach((row) => {
            const projectId = row.project_id;
            const projectName = row.project_name;
            const usecaseCount = row.usecase_count;
            const completed = row.completed;

            usecase_overview[projectId] = {
				project_id: projectId,
				project_name: projectName,
				completed: completed,
				incomplete: usecaseCount-completed,
			};
		});
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(Object.values(usecase_overview)),
		};
	} catch (e) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ error: e.message || "An error occurred" }),
		};
	}finally{
         client.end()
    }
};
