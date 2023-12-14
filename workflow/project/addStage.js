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
		const usecase_id = event.pathParameters.usecase_id;
		const requestBody = JSON.parse(event.body);
		const { index, stage } = requestBody;

		const result = await client.query(
			`SELECT * FROM usecases_table WHERE id = $1`,
			[usecase_id]
		);
		const existingData = result.rows[0].usecase;
		const projectId = result.rows[0].project_id;

		if (!existingData.workflow) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({ message: "Workflow does not exists" }),
			};
		}
		const allKeys = existingData.workflow
			.map((obj) => Object.keys(obj))
			.flat();
		if (allKeys.includes(Object.keys(stage)[0])) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({ message: "Stage already exists" }),
			};
		}
		const newStage = transformStage(stage);
		existingData.workflow.splice(index, 0, newStage);
		//Beginnig the transaction
		await client.query("BEGIN");
		await client.query(
			`UPDATE usecases_table SET usecase = $1 WHERE id = $2`,
			[existingData, usecase_id]
		);
		let tasks = addTasks(stage, projectId, usecase_id);
		const taskInsertQuery = `
                    INSERT INTO tasks_table (usecase_id, project_id, stage, task)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id;
                `;
		for (const task of tasks) {
			const { usecaseId, projectId, stageName, task: taskDetails } = task;
			await client.query(taskInsertQuery, [
				usecaseId,
				projectId,
				stageName,
				taskDetails,
			]);
		}
		//commitng the transaction
		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Stage added successfully" }),
		};
	} catch (error) {
		console.error("Error updating data:", error);
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Internal Server Error",
				error: error.message,
			}),
		};
	} finally {
		await client.end();
	}
};
function transformStage(stageObject) {
	const stageName = Object.keys(stageObject)[0];
	const stageData = stageObject[stageName];

	const transformedStage = {
		[stageName]: {
			checklists: stageData.checklists.map((item, index) => ({
				checked: false,
				item_id: index + 1,
				description: item,
			})),
			assignee_id: "",
		},
	};
	return transformedStage;
}

function addTasks(stageObject, projectId, usecaseId) {
	const stageName = Object.keys(stageObject)[0];
	const stageData = stageObject[stageName];

	return stageData.tasks.map((taskName) => ({
		usecaseId,
		projectId,
		stageName,
		task: {
			name: taskName,
			created_date: new Date(),
			start_date: "",
			end_date: "",
			resource_start_date: "",
			resource_end_date: "",
			task_assigned_date: "",
			assigned_by_id: "",
			status: "",
			comments: [],
		},
	}));
}
