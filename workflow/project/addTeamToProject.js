const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.addTeamToProject = async (event) => {
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
        const requestBody = JSON.parse(event.body);

        const projectId = requestBody.project_id;
        const teamName = requestBody.team_name;
        const createdBy = requestBody.created_by_id;
        const createdTime = requestBody.created_time;
        const roles = requestBody.roles;

        // Fetch the existing JSON data from the database
        const result = await client.query('SELECT id, project FROM projects_table WHERE id = $1', [projectId]);
        const existingData = result.rows[0];

        if (!existingData) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Project not found' }),
            };
        }

        // Ensure that 'project' property exists in existingData
        existingData.project = existingData.project || {};
        
        // Ensure that 'teams' property exists in existingData.project
        existingData.project.teams = existingData.project.teams || [];

        // Update the JSON data with the provided "teams" object
        const newTeam = {
            team_name: teamName,
            created_by_id: createdBy,
            created_time: createdTime,
            roles: roles
        };

        existingData.project.teams.push(newTeam);

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