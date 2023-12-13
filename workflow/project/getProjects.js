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

        const projectStatusFilter = event.queryStringParameters && event.queryStringParameters.status;

        const projectsQuery = projectStatusFilter
            ? `SELECT * FROM projects_table WHERE project->>'status' = '${projectStatusFilter}'`
            : 'SELECT * FROM projects_table';
        console.log(projectsQuery)
        const usecasesQuery = 'SELECT * FROM usecases_table';

        const projectsResult = await client.query(projectsQuery);
        const usecasesResult = await client.query(usecasesQuery);

        const outputData = processDatabaseData(projectsResult.rows, usecasesResult.rows);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(outputData),
        };
    } catch (error) {
        console.error('Error executing query:', error);
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

function processDatabaseData(projects, usecases) {
    const outputData = projects.map((project) => {
        const projectUsecases = usecases.filter(u => u.project_id === project.id);
        const totalUsecases = projectUsecases.length;

        const projectData = project.project || {}; 

        const totalRoles = projectData.teams
            ? Object.values(projectData.teams).reduce((acc, team) => {
                if (team.roles) {
                    Object.values(team.roles).forEach(roleNames => {
                        acc += roleNames.length;
                    });
                }
                return acc;
            }, 0)
            : 0;

        return {
            project_id: project.id,
            project_name: projectData.name || '', 
            project_status: projectData.status || '', 
            total_resources: totalRoles,
            total_usecases: totalUsecases
        };
    });

    return outputData;
}

