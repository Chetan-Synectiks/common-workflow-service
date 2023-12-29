const { Client } = require('pg');
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
exports.handler = async (event) => {
    const project_id = event.queryStringParameters?.project_id;
    if (!project_id) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Missing project_id parameter' }),
        };
    }

    const secretsManagerClient = new SecretsManagerClient({
        region: "us-east-1",
    });
    const configuration = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: "serverless/lambda/credintials" })
    );
    const dbConfig = JSON.parse(configuration.SecretString);

    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: "workflow",
        user: dbConfig.engine,
        password: dbConfig.password,
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

        const projectQuery = `
            SELECT
            p.id AS project_id,
            p.project->>'name' AS project_name,
            p.project->'updated_by_id' AS updated_by_id,
            r.resource->>'name' AS updated_by_name,
            p.project->>'project_description' AS project_description
        FROM projects_table p
        LEFT JOIN resources_table r ON (p.project->>'updated_by_id')::uuid = (r.id)::uuid
        WHERE p.id = $1
        `;

        const projectResult = await client.query(projectQuery, [project_id]);
        const project = projectResult.rows[0];

        const usecasesQuery = `
            SELECT
            u.workflow_id,
            w.name AS workflow_name,
            COUNT(DISTINCT u.id) AS total_usecases,
            COUNT(t.id) AS total_tasks,
            COUNT(t.id) FILTER (WHERE (t.task ->> 'status') = 'completed') AS task_completed
        FROM usecases_table u
        LEFT JOIN tasks_table t ON u.id = t.usecase_id
        LEFT JOIN workflows_table w ON u.workflow_id = w.id
        WHERE u.project_id = $1
        GROUP BY u.workflow_id, w.name
        `;

        const usecasesResult = await client.query(usecasesQuery, [project_id]);
        const workflows = usecasesResult.rows.map(row => ({
            workflow_id: row.workflow_id,
            workflow_name: row.workflow_name,
            total_usecases: row.total_usecases,
            task_completed: row.task_completed,
            task_completion_percentage: calculatePercentage(row.total_tasks, row.task_completed),
        }));

        const response = {
            project_id: project.project_id,
            project_name: project.project_name,
            updated_by_id: project.updated_by_id,
            updated_by_name: project.updated_by_name,
            project_description: project.project_description,
            workflows: workflows,
        };

        await client.end();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
function calculatePercentage(total, completed) {
    return total === 0 ? 0 : (completed / total) * 100;
}
