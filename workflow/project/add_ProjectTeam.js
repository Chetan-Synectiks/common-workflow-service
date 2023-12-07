exports.add_ProjectTeam = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflowapi",
        user: "postgres",
        password: ""
    });
    
    await client.connect();

    try {
        const projectId = event.queryStringParameters.projectId;

        // Fetch the existing JSON data from the database
        const result = await client.query('SELECT id, project FROM projects_table WHERE id = $1', [projectId]);
        const existingData = result.rows[0];

        // Parse the "teams" object from the request body
        const teamsObject = JSON.parse(event.body);

        // Update the JSON data with the provided "teams" object
        existingData.project.teams = teamsObject;

        // Update the JSON data back to the database
        await client.query('UPDATE projects_table SET project = $1 WHERE id = $2', [existingData.project, projectId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data updated successfully' }),
        };
    } catch (error) {
        console.error('Error updating data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};