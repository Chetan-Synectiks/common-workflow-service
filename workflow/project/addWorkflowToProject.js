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

        const requestBody = JSON.parse(event.body);

        const projectId = requestBody.project_id;
        const workflowName = requestBody.workflow_name;
        const stages = requestBody.stages;

        const result = await client.query('SELECT id, project FROM projects_table WHERE id = $1', [projectId]);
        const existingData = result.rows[0];

        if (!existingData) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Project not found' }),
            };
        }

        existingData.project = existingData.project || {};

        existingData.project.workflows = existingData.project.workflows || {};

        if (existingData.project.workflows[workflowName]) {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Workflow with the same name already exists' }),
            };
        }

        const newWorkflow = {
            created_by_id: requestBody.created_by_id,
            created_time: requestBody.created_time,
            stages: stages
        };

        existingData.project.workflows[workflowName] = newWorkflow;

        await client.query('UPDATE projects_table SET project = $1 WHERE id = $2', [existingData.project, projectId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Workflow added successfully' }),
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
