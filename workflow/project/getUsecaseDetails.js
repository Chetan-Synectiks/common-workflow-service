const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const usecaseId = event.queryStringParameters?.usecase_id ?? null;
	if (usecaseId == null || usecaseId === "") {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Usecase id is required",
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
	let stagesQuery = `
                    select 
                        u.usecase->'workflow' as workflow
                    from
                        usecases_table as u
                    where 
                        u.id = $1`;
	let tasksQuery = `
                    select 
                        t.id AS task_id,
                        t.task->>'name' AS task_name,
                        t.assignee_id AS assigned_to,
                        t.task->>'start_date' AS start_date,
                        t.task->>'end_date' AS end_date,
                        t.task->'comments' AS t_comments
                    from  
                        tasks_table AS t
                    join 
                        usecases_table ON t.usecase_id = usecases_table.id
                    where 
                        usecases_table.id = $1
                    and
                        t.stage = $2`;
	let tasksQuery2 = `
                    select 
                        t.id AS task_id,
                        t.task->>'name' AS task_name,
                        t.assignee_id AS assigned_to,
                        t.task->>'start_date' AS start_date,
                        t.task->>'end_date' AS end_date,
                        t.task->'comments' AS t_comments,
                        t.stage as stage
                    from  
                        tasks_table AS t
                    join 
                        usecases_table ON t.usecase_id = usecases_table.id
                    where 
                        usecases_table.id = $1`;
	try {
		const stageResult = await client.query(stagesQuery, [usecaseId]);
		const taskResult = await client.query(tasksQuery2, [usecaseId]);
		const { workflow } = stageResult.rows[0];
		const stagesArray = Object.keys(workflow).flatMap((index) => {
			const de = [];
			Object.keys(workflow[index]).forEach((name) => {
				const { assigne_id, description } = workflow[index][name];
				const d = {
					name,
					assigne_id: assigne_id || "",
					description: description || "",
				};
				de.push(d);
			});
			return de;
		});
		const taskArray = taskResult.rows.map(
			({
				task_id,
				task_name,
				assigned_to,
				start_date,
				end_date,
				t_comments,
                stage
			}) => ({
				task_id,
				task_name,
				assigned_to: assigned_to || "",
				start_date,
				end_date,
				comments: t_comments,
                stage
			})
		);
		stagesArray.map((stage) => {
            const tasks = taskArray.filter((task) => task.stage == stage.name)
            stage.tasks = tasks
        });
		// const ob = await Promise.all(
		//     Object.keys(workflow).flatMap(async (index) => {
		//       const de = await Promise.all(
		//         Object.keys(workflow[index]).map(async (name) => {
		//           const taskResult = await client.query(tasksQuery,[usecaseId, name]);
		//           const tasks = taskResult.rows.map(
		//             ({ task_id, task_name, assigned_to, start_date, end_date, t_comments }) => ({
		//               task_id,
		//               task_name,
		//               assigned_to: assigned_to || '',
		//               start_date,
		//               end_date,
		//               comments : t_comments,
		//             })
		//           );
		//           const { assignee_id, description } = workflow[index][name];
		//           return {
		//             name,
		//             assignee_id: assignee_id || "",
		//             description: description || "",
		//             tasks,
		//           };
		//         })
		//       );
		//       return de;
		//     })
		//   );
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(stagesArray),
		};
	} catch (e) {
		await client.end();
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
