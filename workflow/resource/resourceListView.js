const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
exports.handler = async (event) => {
    const projectId = event.queryStringParameters && event.queryStringParameters.project_id;

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
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const resourcesQuery = 'SELECT * FROM resources_table';
        const projectsQuery = 'SELECT * FROM projects_table';
        const tasksQuery = 'SELECT * FROM tasks_table';

        const resourcesResult = await client.query(resourcesQuery);
        const projectsResult = await client.query(projectsQuery);
        const tasksResult = await client.query(tasksQuery);

        const responseData = resourcesResult.rows.map((resource) => {
            const resourceTasks = tasksResult.rows.filter((task) => task.assignee_id === resource.id);

            const currentTask = resource.resource.current_task;
            const currentTaskDetails = resourceTasks.find(task => task.id === currentTask.task_id);

            const assigned_date = currentTaskDetails ? currentTaskDetails.task.task_assigned_date : null;
            const due_date = currentTaskDetails ? currentTaskDetails.task.end_date : null;

            const resourceProjects = projectsResult.rows
                .filter((project) => {
                    const team = project.project.team;
                    const roles = team.roles.flatMap((role) => Object.values(role)[0]);

                    const matchRoles = roles.includes(resource.id);
                    const matchProjectId = !projectId || project.id === projectId;

                    return matchRoles && matchProjectId;
                })
                .map((project) => ({
                    project_id: project.id,
                    project_name: project.project.name,
                    project_img_url: project.project.project_icon_url,
                }));

            const includeResource = resourceProjects.length > 0 || !projectId;

            return includeResource ? {
                resource_id: resource.id,
                resource_name: resource.resource.name,
                total_tasks: resourceTasks.length,
                total_projects: resourceProjects.length,
                role: resource.resource.role,
                resource_img_url: resource.resource.image,
                resource_email: resource.resource.email,
                projects: resourceProjects,
                assigned_date,
                due_date,
            } : null;
        }).filter(Boolean);

        const response = {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };

        return response;
    } catch (err) {
        console.error('Error executing query', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
