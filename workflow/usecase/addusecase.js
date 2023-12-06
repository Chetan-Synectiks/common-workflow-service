const { Client } = require('pg');

exports.addusecase = async (event) => {
    const requestBody = JSON.parse(event.body);

    const { project_id, created_by_id, usecase_name, assigned_to_id, description } = requestBody;

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

        const result = await client.query(
            'INSERT INTO usecases_table (project_id, usecase) VALUES ($1, $2) RETURNING *',
            [project_id, {
                name: usecase_name,
                usecase_assignee_id: assigned_to_id,
                description: description,
                created_by_id: created_by_id,
                start_date: "date",
                end_date: "date",
                creation_date: "date",
                status: "",
                current_stage: "stage_name",
            }]
        );

        const insertedData = result.rows[0];

        const projectStagesResult = await client.query(
            'SELECT project->\'stages\' as stages FROM projects_table WHERE id = $1',
            [project_id]
        );

        const stages = projectStagesResult.rows[0].stages;

        const stagesData = {};
        for (const stageName in stages) {
            stagesData[stageName] = {
                assigne_id: assigned_to_id,
                checklists: stages[stageName].checklists.map((item, index) => ({
                    item_id: index + 1,
                    description: item,
                    checked: false,
                })),
            };
        }

        await client.query(
            'UPDATE usecases_table SET usecase = jsonb_set(usecase, $1, $2) WHERE id = $3',
            ['{stages}', stagesData, insertedData.id]
        );

        for (const stageName in stages) {
            const stage = stages[stageName];

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
                created_by_id: insertedData.usecase.created_by_id,
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
