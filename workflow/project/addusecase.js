const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
exports.handler = async (event) => {

    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);

    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });

    const requestBody = JSON.parse(event.body);
    const { project_id, created_by_id, usecase_name, assigned_to_id, description, workflow_name } = requestBody;
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
        const projectQuery = `
            SELECT project->'workflows'->$1 AS workflow
            FROM projects_table
            WHERE id = $2;
        `;
        const workflowResult = await client.query(projectQuery, [workflow_name, project_id]);

        if (workflowResult.rowCount == 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: "Workflow with provided name does not exist"
                }),
            };
        }
        const workflowDetails = workflowResult.rows[0].workflow.stages;
        await client.query('BEGIN');

        const usecaseInsertQuery = `
          INSERT INTO usecases_table (project_id, usecase)
          VALUES ($1, $2)
          RETURNING id;
        `;
        const Workflow = [];
        for (const stage of workflowDetails) {
            const stageName = Object.keys(stage)[0];
            const checklists = Array.isArray(stage[stageName].checklists) ? stage[stageName].checklists : [];

            const workflowStage = {
                [stageName]: {
                    assignee_id: '',
                    checklists: checklists.map((item, index) => ({
                        item_id: index + 1,
                        description: item,
                        checked: false,
                    }))
                },
            };

            Workflow.push(workflowStage);
        }
        console.log(Workflow)
        const usecaseValues = [
            project_id,
            {
                name: usecase_name,
                usecase_assignee_id: assigned_to_id,
                description,
                start_date: "",
                end_date: "",
                creation_date: "",
                status: "",
                current_stage: "",
                workflow: Workflow,
            },
        ];

        const usecaseResult = await client.query(usecaseInsertQuery, usecaseValues);
        const usecase_id = usecaseResult.rows[0].id;

        for (const stage of workflowDetails) {
            const stageName = Object.keys(stage)[0];

            for (const taskName of stage[stageName].tasks) {
                const taskInsertQuery = `
                    INSERT INTO tasks_table (usecase_id, project_id, stage, task)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id;
                `;

                const taskValues = [
                    usecase_id,
                    project_id,
                    stageName,
                    {
                        name: taskName,
                        created_date: "",
                        start_date: "",
                        end_date: "",
                        resource_start_date: "",
                        resource_end_date: "",
                        task_assigned_date: "",
                        assigned_by_id: "",
                        status: "unassgined",
                        comments: [],
                    },
                ];

                await client.query(taskInsertQuery, taskValues);
            }
        }

        await client.query('COMMIT');

        const response = {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                usecase_id,
                project_id,
                created_by_id,
                usecase_name,
                assigned_to_id,
                description,
            }),
        };

        return response;
    } catch (error) {
        console.error('Error inserting data:', error);
        if (error.message.includes('invalid input')) {
            await client.query('ROLLBACK');
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Bad Request - Invalid input'
                }),
            };
        }
        await client.query('ROLLBACK');

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
