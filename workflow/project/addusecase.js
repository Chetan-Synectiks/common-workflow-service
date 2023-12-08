const { Client } = require('pg');

exports.addusecase = async (event) => {
    const requestBody = JSON.parse(event.body);

    const { project_id, usecase_name, assigned_to_id, description } = requestBody;

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    try {
        await client.connect();

        await client.query('BEGIN');

        // Get workflow_name from projects_table
        const projectWorkflowResult = await client.query(
            'SELECT project->\'workflow\'->\'workflow_name\' as workflow_name FROM projects_table WHERE id = $1',
            [project_id]
        );

        const workflowName = projectWorkflowResult.rows[0].workflow_name;
        // Insert new usecase
        const result = await client.query(
            'INSERT INTO usecases_table (project_id, usecase) VALUES ($1, $2) RETURNING *',
            [project_id, {
                name: usecase_name,
                usecase_assignee_id: assigned_to_id,
                description: description,
                start_date: "date",
                end_date: "date",
                creation_date: "date",
                status: "",
                current_stage: "stage_name",
                workflow_name: workflowName,
            }]
        );

        const insertedData = result.rows[0];

        // Extract stages data from workflow_name
        const stagesData = {};
        for (const stageName in workflowName) {
            stagesData[stageName] = {
                tasks: workflowName[stageName].tasks,
                checklists: workflowName[stageName].checklists.map((item) => item.description),
            };
        }

        // Update usecase with stagesData
        await client.query(
            'UPDATE usecases_table SET usecase = jsonb_set(usecase, $1, $2) WHERE id = $3',
            ['{workflow_name}', stagesData, insertedData.id]
        );

        // Insert tasks for each stage
        for (const stageName in workflowName) {
            const stage = workflowName[stageName];

            for (const taskName of stage.tasks) {
                const taskData = {
                    usecase_id: insertedData.id,
                    project_id: project_id,
                    assignee_id: assigned_to_id,
                    stage: stageName,
                    task: {
                        created_date: 'current-date',
                        start_date: 'start-date',
                        end_date: 'end-date',
                        resource_start_date: 'resource-start-date',
                        resource_end_date: 'resource-end-date',
                        status: '',
                        comments: [],
                    },
                };

                await client.query(
                    'INSERT INTO tasks_table (usecase_id, project_id, assignee_id, stage, task) VALUES ($1, $2, $3, $4, $5)',
                    [taskData.usecase_id, taskData.project_id, taskData.assignee_id, taskData.stage, taskData.task]
                );
            }
        }

        await client.query('COMMIT');

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                usecase_id: insertedData.id,
                project_id: insertedData.project_id,
                usecase_name: insertedData.usecase.name,
                assigned_to_id: insertedData.usecase.usecase_assignee_id,
                description: insertedData.usecase.description,
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
