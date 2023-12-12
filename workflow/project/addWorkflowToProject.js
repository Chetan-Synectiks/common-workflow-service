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
        await client.connect();

        // Check if the workflow name already exists
        const existingWorkflow = await client.query(`
            SELECT project->'workflows'->'${updateData.workflow_name}' AS workflow
            FROM projects_table
            WHERE id = $1;
        `, [updateData.project_id]);

        if (existingWorkflow.rows.length > 0 && existingWorkflow.rows[0].workflow) {
            console.log(`Workflow "${updateData.workflow_name}" already present for project ${updateData.project_id}`);
            return {
                statusCode: 200,
                body: JSON.stringify(`Workflow "${updateData.workflow_name}" already present for project ${updateData.project_id}`),
            };
        }

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
