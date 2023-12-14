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

    const project_id = event.queryStringParameters.project_id;
    const team_name = event.queryStringParameters.team_name;
    const role = event.queryStringParameters.role;
    const resourceName = event.queryStringParameters.resource_name;

    if (!project_id || !team_name || !role) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Missing required parameters: project_id, team_name, role' }),
        };
    }

    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const teamDataResult = await client.query(
            'SELECT project->\'teams\' as teams FROM projects_table WHERE id = $1',
            [project_id]
        );

        const teamsData = teamDataResult.rows[0]?.teams || {};

        if (teamsData[team_name]) {
            const teamRoles = teamsData[team_name].roles || {};
            if (teamRoles[role]) {
                const resourceIds = teamRoles[role];

                let query = 'SELECT id, resource->>\'name\' as name, resource->>\'image_url\' as image_url FROM resources_table WHERE id = ANY($1)';

                const queryParams = [resourceIds];

                if (resourceName) {
                    query += ' AND resource->>\'name\' ILIKE $2';
                    queryParams.push(`%${resourceName}%`);
                } else {
                    query += ' LIMIT 10';
                }

                const resourceResult = await client.query(query, queryParams);
                const resultdata = resourceResult.rows;
                const response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(resultdata),
                };

                return response;
            } else {
                return {
                    statusCode: 404,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ message: 'Role not found in the specified team' }),
                };
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ message: 'Team not found' }),
            };
        }
    } catch (error) {
        console.error('Error fetching resources:', error);

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
