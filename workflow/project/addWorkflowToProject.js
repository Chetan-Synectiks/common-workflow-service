const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
exports.addWorkflowToProject = async (event) => {

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

    const updateData = JSON.parse(event.body);
    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const workflowName = updateData.workflow_name;
        const stages = updateData.stages;

        const stageUpdates = Object.keys(stages).map((stageName) => {
            const tasks = stages[stageName].tasks;
            const checklists = stages[stageName].checklists;

            return `"${stageName}": {
                "tasks": ${JSON.stringify(tasks)},
                "checklists": ${JSON.stringify(checklists)}
            }`;
        });

        await client.query(`
            UPDATE projects_table
            SET project = jsonb_set(
                project,
                '{workflows, ${workflowName}}',
                '{"stages": {${stageUpdates.join(',')}}}',
                true
            )
            WHERE id = $1;
        `, [updateData.project_id]);

        console.log(`Workflows updated for project: ${updateData.project_id}, workflow: ${workflowName}`);

        return {
            statusCode: 201,
            body: JSON.stringify('Workflows updated successfully'),
        };
    } catch (error) {
        console.error('Error updating workflows data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Internal Server Error'),
        };
    } finally {
        await client.end();
    }
};
