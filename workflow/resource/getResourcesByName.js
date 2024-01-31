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
	const name = event.queryStringParameters?.name;
	const projectId = event.queryStringParameters?.project_id ?? null;
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
		let result = await client.query(
			`
                SELECT
                    (r.id) as resource_id,
                    (r.resource->>'name') as resource_name,
                    (r.resource->>'image') as image_url,
                    (r.resource->>'email') as email
                from 
                    resources_table as r
                WHERE LOWER(r.resource->> 'name') LIKE LOWER('%' || $1 || '%')`,
			[name]
		);
		const resource = result.rows.map(
			({ resource_id, resource_name, image_url, email }) => ({
				resource_id,
				resource_name,
				image_url,
				email,
			})
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(resource),
		};
	} catch (error) {
		console.error("error", error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Internal server error" }),
		};
	} finally {
		await client.end();
	}
};