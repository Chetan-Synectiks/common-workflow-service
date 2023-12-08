const { Client } = require('pg');

exports.getResourcesByRole = async (event) => {
    const project_id = event.queryStringParameters.project_id;
    const team_name = event.queryStringParameters.team_name;
    const role = event.queryStringParameters.role;
    const resourceName = event.queryStringParameters.resource_name;

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    try {
        await client.connect();

        const teamDataResult = await client.query(
            'SELECT project->\'teams\' as teams FROM projects_table WHERE id = $1',
            [project_id]
        );

        const teamsData = teamDataResult.rows[0]?.teams || {};

        if (teamsData[team_name]) {

            if (teamsData[team_name][role]) {
                const resourceIds = teamsData[team_name][role];

                let query = 'SELECT id, resource->>\'name\' as name, resource->>\'image\' as image FROM resources_table WHERE id = ANY($1)';
                const queryParams = [resourceIds];

                if (resourceName) {
                    query += ' AND resource->>\'name\' ILIKE $2';
                    queryParams.push(`%${resourceName}%`);
                }

                const resourceResult = await client.query(query, queryParams);

                const resources = resourceResult.rows;

                const response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        resources: resources,
                    }),
                };

                return response;
            } else {

                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Role not found in the specified team' }),
                };
            }
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Team not found' }),
            };
        }
    } catch (error) {
        console.error('Error fetching resources:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
