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

	const query = `
                update projects_table
                set project = jsonb_set(
                    project,
                    '{team}',
                    coalesce(project->'team', '{}'::jsonb) || $1::jsonb,
                    true
                )
                where 
                    id = $2`;
	try {
		const requestBody = JSON.parse(event.body);
		const { project_id, team_name, created_by_id, roles } = requestBody;

		const team = {
			team_name: team_name,
			created_by_id: created_by_id,
			created_time: new Date(),
			roles: roles,
		};

        console.log(team)
		const res = await client.query(query, [team, project_id]);
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: res,
			}),
		};
	} catch (error) {
		console.error("Error updating data:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Internal Server Error" }),
		};
	} finally {
		await client.end();
	}
};
