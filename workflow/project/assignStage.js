exports.assignStage = async (event) => {
    const requestBody = JSON.parse(event.body);
    const { usecase_id, stage_name, assigned_to_id, assigned_by_id, updated_by_id, description } = requestBody;

    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);

    const { Client } = require('pg');
    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });

    try {
        await client.connect();
        const result = await client.query(`UPDATE usecase_table
                                SET usecase =
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    usecase,
                                                    '{workflow, ${stage_name}, assigne_id}',
                                                    '"${assigned_to_id}"'
                                                ),
                                                '{workflow, ${stage_name}, assigned_by_id}',
                                                '"${assigned_by_id}"'
                                            ),
                                            '{workflow, ${stage_name}, updated_by_id}',
                                            '"${updated_by_id}"'
                                        ),
                                        '{workflow, ${stage_name}, description}',
                                        '"${description}"'
                                    )
                                WHERE id = '${usecase_id}' AND usecase->'workflow' ? '${stage_name}' `);
        if (result.rowCount === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No matching records found' })
            };
        }

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Stage assigned successfully' })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error While assigning' })
        };
    } finally {
        await client.end();
    }
};