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
	const status = event.queryStringParameters?.project_status ?? null;
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
						(p.project->>'project_manager_id') as manager_id,
						(p.project->'teams'->jsonb_object_keys(project->'teams')->'roles') as team,
						(
							select 
								(r.resource)
							from 
								resources_table as r 
							where 
								r.id = (p.project->>'project_manager_id')::uuid
						) as project_manager_details,
						(
							select 
								count(t.id) as total_tasks
							from 
								tasks_table as t
							where 
								t.assignee_id = (p.project->>'project_manager_id')::uuid
						)
					FROM projects_table AS p`;
		let queryParams = [];
		if(status != null){
			query += `
					WHERE 
						(p.project->>'status' = $1)`
			queryParams.push(status)
		}
		const result = await client.query(query, queryParams);
		const response = await Promise.all(
			result.rows.map(
				async ({
					project_id,
					project_name,
					manager_id,
					team,
					project_manager_details,
					total_tasks,
				}) => {
					const resourceIds = Array.from(
						new Set(Object.values(team).flat())
					);
					const resourceQuery = `
					SELECT
						id as resource_id,
						resource->>'name' as resource_name,
						resource->>'image' as image_url,
						resource->>'email' as email
					FROM
					 resources_table 
					WHERE 
						id IN (${resourceIds.map((id) => `'${id}'`).join(", ")})`;
					const ress = await client.query(resourceQuery);
					const resources = ress.rows.map(
						({ resource_id, resource_name, image_url, email }) => ({
							resource_id,
							resource_name,
							image_url,
							email,
						})
					);
					return {
						project_id,
						project_name,
						manager_id,
						manager_name: project_manager_details.name,
						manager_image_url:
							project_manager_details?.image || "",
						current_task:
							project_manager_details?.current_task?.task_name ||
							"",
						created_date:
							project_manager_details?.current_task
								?.created_date || "",
						due_date:
							project_manager_details?.current_task?.due_date ||
							"",
						total_tasks,
						project_resources: resources,
					};
				}
			)
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(response),
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
