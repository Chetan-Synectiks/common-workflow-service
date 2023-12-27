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

    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const projectFilter = event.queryStringParameters && event.queryStringParameters.project_id;

        const resourcesQuery = 'SELECT * FROM resources_table';
        let projectsQuery = 'SELECT * FROM projects_table';

        if (projectFilter) {
            projectsQuery = `SELECT * FROM projects_table WHERE id = '${projectFilter}'`;
        }

        const resourcesResult = await client.query(resourcesQuery);
        const projectsResult = await client.query(projectsQuery);

        const outputData = processResourcesData(resourcesResult.rows, projectsResult.rows, projectFilter);

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

function processResourcesData(resources, projects, projectFilter) {
    const outputData = [];

    for (const resource of resources) {
        const resourceId = resource.id;
        const resourceName = resource.resource.name;
        const resourceRole = resource.resource.role;
        const resourceImgUrl = resource.resource.image;
        const resourceEmail = resource.resource.email;

        const resourceProjects = projects
            .filter(project =>
                project.project.team.roles.some(role =>
                    Object.values(role).flat().includes(resourceId)
                )
            )
            .map(project => ({
                project_id: project.id,
                project_name: project.project.name,
                project_img_url: project.project.project_icon_url,
            }));

        if (projectFilter) {
            const filteredProjects = resourceProjects.filter(project => project.project_id === projectFilter);
            if (filteredProjects.length > 0) {
                outputData.push({
                    resource_id: resourceId,
                    resource_name: resourceName,
                    role: resourceRole,
                    resource_img_url: resourceImgUrl,
                    resource_email: resourceEmail,
                    projects: filteredProjects,
                });
            }
        } else {
            outputData.push({
                resource_id: resourceId,
                resource_name: resourceName,
                role: resourceRole,
                resource_img_url: resourceImgUrl,
                resource_email: resourceEmail,
                projects: resourceProjects,
            });
        }
    }

    return outputData;
}