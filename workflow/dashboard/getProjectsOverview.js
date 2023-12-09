const { Client } = require('pg');
exports.getProjectsOverview = async (event) => {
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

        const projectStatusFilter = event.queryStringParameters && event.queryStringParameters.project_status;

        const projectsQuery = projectStatusFilter
            ? `SELECT * FROM projects_table WHERE project->>'status' = '${projectStatusFilter}'`
            : 'SELECT * FROM projects_table';

        const usecasesQuery = 'SELECT * FROM usecases_table';
        const tasksQuery = 'SELECT * FROM tasks_table';

        const projectsResult = await client.query(projectsQuery);
        const usecasesResult = await client.query(usecasesQuery);
        const tasksResult = await client.query(tasksQuery);


        const outputData = processDatabaseData(projectsResult.rows, usecasesResult.rows, tasksResult.rows);


        //console.log(outputData);

        return {
            statusCode: 200,
            body: JSON.stringify(outputData),
        };
    } catch (error) {
        console.error('Error executing query:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};


function processDatabaseData(projects, usecases, tasks) {

    const outputData = projects.map((project) => {
        const projectUsecases = usecases.filter(u => u.project_id === project.id);
        const projectTasks = tasks.filter(t => t.project_id === project.id);

        const totalUsecases = projectUsecases.length;
        const completedUsecases = projectUsecases.filter(u => u.usecase.status === 'completed').length;
        const completedTasksPercentage = calculateCompletedTasksPercentage(projectTasks);

        return {
            project_id: project.id,
            project_name: project.project.name,
            status: project.project.status,
            total_usecases: totalUsecases,
            completed_usecases: completedUsecases,
            due_date: project.project.end_date,
            completed_tasks_percentage: completedTasksPercentage,
        };
    });

    return outputData;
}

function calculateCompletedTasksPercentage(tasks) {

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.task.status === 'completed').length;

    if (totalTasks === 0) {
        return 0;
    }

    return (completedTasks / totalTasks) * 100;
}
