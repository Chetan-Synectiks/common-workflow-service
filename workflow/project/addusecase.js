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

    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const projectQuery = `
            SELECT project->'workflows'->$1 AS workflow
            FROM projects_table
            WHERE id = $2;
        `;

        const projectValues = [workflow_name, project_id];
        const projectResult = await client.query(projectQuery, projectValues);

        if (!projectResult.rows[0] || !projectResult.rows[0].workflow || !projectResult.rows[0].workflow.stages) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Bad Request - Invalid project data or missing workflow stages'
                }),
            };
        }

        const workflowDetails = projectResult.rows[0].workflow.stages;

        await client.query('BEGIN');

        const usecaseInsertQuery = `
          INSERT INTO usecases_table (project_id, usecase)
          VALUES ($1, $2)
          RETURNING id;
        `;

        const Workflow = [];
        for (const stageName in workflowDetails) {
            const stage = workflowDetails[stageName];

            const workflowStage = {
                [stageName]: {
                    assigne_id: assigned_to_id,
                    checklists: stage.checklists.map((item, index) => ({
                        item_id: index + 1,
                        description: item,
                        checked: false,
                    })),
                },
            };

            Workflow.push(workflowStage);
        }

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

        for (const stageName in workflowDetails) {
            const stage = workflowDetails[stageName];

            for (const taskName of stage.tasks) {
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
                        status: "",
                        comments: [],
                    },
                ];

                const taskResult = await client.query(taskInsertQuery, taskValues);
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
