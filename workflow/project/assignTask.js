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

    const newtask = JSON.parse(event.body);
    const taskid = newtask.task_id;
    const assigne_id = newtask.assigned_to_id;
    const startdate = newtask.start_date;
    const enddate = newtask.end_date;
    const updatedby = newtask.updated_by_id;
    const assignedby = newtask.assigned_by_id;
    const cmt = newtask.comments;

    try {
        await client.connect();
        const update = await client.query(` UPDATE tasks_table
                            SET 
                                assignee_id = $1,
                                task = jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    task,
                                                    '{start_date}',
                                                    $2::jsonb
                                                ),
                                                '{end_date}',
                                                $3::jsonb
                                            ),
                                            '{updated_by_id}',
                                            $4::jsonb
                                        ),
                                        '{assigned_by_id}',
                                        $5::jsonb
                                    ),
                                    '{description}',
                                    $6::jsonb
                                )
                            WHERE 
                                id = $7 `,
            [assigne_id, JSON.stringify(startdate), JSON.stringify(enddate), JSON.stringify(updatedby), JSON.stringify(assignedby), JSON.stringify(cmt), taskid]
        );
        if (update.rowCount === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ message: 'No matching records found' })
            };
        }
        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "successfully task is assigned " }),
        };
    } catch (e) {
        console.error("Error:", e);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "error while assigining task" }),
        };
    } finally {
        await client.end();
    }
};
