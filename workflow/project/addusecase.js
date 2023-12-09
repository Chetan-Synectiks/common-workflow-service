const { Client } = require('pg');
exports.addusecase = async (event) => {
    const requestBody = JSON.parse(event.body);
    const { project_id, usecase_name, assigned_to_id, description, workflow_name } = requestBody;

    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
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

    try {
        await client.connect();
        await client.query('BEGIN');

        const projectQuery = `
          SELECT project->'workflows'->'${workflow_name}' AS workflow
          FROM projects_table
          WHERE id = $1;
        `;

        const projectValues = [project_id];
        const projectResult = await client.query(projectQuery, projectValues);
        const workflowDetails = projectResult.rows[0].workflow;

        const usecaseInsertQuery = `
          INSERT INTO usecases_table (project_id, usecase)
          VALUES ($1, $2)
          RETURNING id;
        `;

        const Workflow = {};
        for (const stageName in workflowDetails) {
            const stage = workflowDetails[stageName];

            const assigne_id = assigned_to_id;

            Workflow[stageName] = {
                assigne_id,
                checklists: stage.checklists.map((item, index) => ({
                    item_id: index + 1,
                    description: item,
                    checked: false,
                })),
            };

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
                workflow_name: Workflow,
            },
        ];

        const usecaseResult = await client.query(usecaseInsertQuery, usecaseValues);
        const usecase_id = usecaseResult.rows[0].id;

        for (const stageName in workflowDetails) {
            const stage = workflowDetails[stageName];

            for (const taskName of stage.tasks) {
                const taskInsertQuery = `
                  INSERT INTO tasks_table (usecase_id, project_id, assignee_id, stage, task)
                  VALUES ($1, $2, $3, $4, $5)
                  RETURNING id;
                `;

                const taskValues = [
                    usecase_id,
                    project_id,
                    assigned_to_id,
                    stageName,
                    {
                        name: taskName,
                        created_date: "",
                        start_date: "",
                        end_date: "",
                        resource_start_date: "",
                        resource_end_date: "",
                        status: "",
                        comments: [],
                    },
                ];

                const taskResult = await client.query(taskInsertQuery, taskValues);
                const taskId = taskResult.rows[0].id;
            }
        }

        await client.query('COMMIT');

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                usecase_id,
                project_id,
                usecase_name,
                assigned_to_id,
                description,
            }),
        };

        return response;
    } catch (error) {
        console.error('Error inserting data:', error);
        await client.query('ROLLBACK');

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
