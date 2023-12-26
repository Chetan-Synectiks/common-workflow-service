const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const projectId = event.queryStringParameters?.project_id ?? null;
	if (projectId == null || projectId === "") {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "ProjectId id is required",
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

	let query = `
                select 
                    p.project->'team'->'roles' as roles 
                from  
                projects_table as p
                where p.id = '68031315-fd7e-48ab-8b9c-66b9dfbdf444'`;
	try {
		const result = await client.query(query);
		const roles = result.rows[0].roles;
		const ress = await Promise.all( roles.map(async (role) => {
			const resourceIds = Object.values(role).flat();
			const resourceQuery = `
					select
						id as resource_id,
						resource->>'name' as resource_name,
						resource->>'image' as image_url,
						resource->>'email' as email
					from
					 resources_table 
					where 
						id IN (${resourceIds.map((id) => `'${id}'`).join(", ")})`;
			const ress = await client.query(resourceQuery);
			const roleName = Object.keys(role).at(0)
			return resource = {
				[roleName] : ress.rows
			}
		}));
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(ress),
		};
	} catch (e) {
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
