const { Client } = require('pg');

exports.getProjectsOverview = async (event, context) => {
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }
    try {

        await client.connect();
        let result;
        if (data.project_status) {
            result = await client.query(`
            SELECT
                project.project_id AS project_id,
                project.project AS project_data,
                usecase.usecase_id AS usecase_id,
                usecase.usecase AS usecase_data
            FROM
                project_table project
            JOIN
                usecase_table usecase ON project.project_id = usecase.project_id
            WHERE project.project->>'status' = $1
        `, [data.project_status]);
        } else {
            result = await client.query(`
            SELECT
                project.project_id AS project_id,
                project.project AS project_data,
                usecase.usecase_id AS usecase_id,
                usecase.usecase AS usecase_data
            FROM
                project_table project
            JOIN
                usecase_table usecase ON project.project_id = usecase.project_id
        `);
        }

        // The result.rows array contains the query results
        const projectData = {};

        result.rows.forEach(row => {
            const projectId = row.project_id;

            if (!projectData[projectId]) {
                projectData[projectId] = {
                    project_data: row.project_data,
                    totalTasks: 0,
                    completedTasks: 0,
                    totalUsecases: 0,
                    completedUsecases: 0,
                };
            }

            const usecase = row.usecase_data;

            // Increment total usecases for the project
            projectData[projectId].totalUsecases++;

            // Increment completed usecases for the project based on the status field
            if (usecase.status === 'completed') {
                projectData[projectId].completedUsecases++;
            }

            const stages = usecase.stages;

            // Calculate total and completed tasks for each stage and accumulate for the project
            Object.keys(stages).forEach(stage => {
                projectData[projectId].totalTasks += stages[stage].tasks.length;
                projectData[projectId].completedTasks += stages[stage].tasks.filter(task => task.status === 'completed').length;
            });
        });

        const projectResults = Object.keys(projectData).map(projectId => {
            const { project_data, totalTasks, completedTasks, totalUsecases, completedUsecases } = projectData[projectId];
            const percentageCompleted = (completedTasks * 100.0) / totalTasks;

            return {
                project_id: projectId,
                project_name: project_data.name,
                status: project_data.status,
                due_date: project_data.end_date,
                completed_tasks_percentage: percentageCompleted,
                total_usecases: totalUsecases,
                completed_usecases: completedUsecases,
            };
        });

        // console.log('Results for all projects:', projectResults);
        objReturn.object = projectResults
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } catch (error) {
        console.error('Error executing query', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};