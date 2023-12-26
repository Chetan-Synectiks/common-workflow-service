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

		const status = event.queryStringParameters?.status ?? null;

		let query = `
                    select 
                        p.id as project_id,
                        p.project->>'name' as proejct_name,
                        p.project->>'project_icon_url' as project_icon_url,
                        p.project->>'status' as status,
                        p.project->'team'->'roles' as roles,
                        COUNT(u.id) as total_usecases
                    from 
                        projects_table as p
                    left join 
                        usecases_table as u on p.id = u.project_id`;
		let queryparams = [];
		if (status != null) {
			query += `
                    where 
                        p.project->>'status' = $1`;
			queryparams.push(status);
		}
		query += `
                    group by
                        p.id`;
		const result = await client.query(query, queryparams);
		const response = result.rows.map(
			({
				project_id,
				proejct_name,
				project_icon_url,
				status,
				roles,
				total_usecases,
			}) => {
				let res = roles?.map((e) => Object.values(e)).flat();
				return {
					project_id,
					proejct_name,
					project_icon_url,
					status,
					total_resources: new Set(res?.flat()).size,
					total_usecases: parseInt(total_usecases),
				};
			}
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(response),
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
