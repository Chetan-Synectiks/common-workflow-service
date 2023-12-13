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
    const requestBody = JSON.parse(event.body);
    const { usecase_id, stage_name, assigned_to_id, assigned_by_id, updated_by_id, description } = requestBody;

    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

            const updateStageQuery = `UPDATE usecases_table
                                SET usecase =
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    usecase,
                                                    '{workflow,  ${stage_name} , assigne_id}',
                                                    $1::jsonb
                                                ),
                                                '{workflow, ${stage_name}, assigned_by_id}',
                                                $2::jsonb
                                            ),
                                            '{workflow, ${stage_name}, updated_by_id}',
                                            $3::jsonb
                                        ),
                                        '{workflow, ${stage_name}, description}',
                                        $4::jsonb
                                    )
                                WHERE id = $5 AND usecase->'workflow' ? $6 `;
                        
            const result = await client.query(updateStageQuery, [
               JSON.stringify (assigned_to_id),
               JSON.stringify (assigned_by_id),
               JSON.stringify (updated_by_id),
               JSON.stringify (description),
                usecase_id,
               stage_name
            
            ]);
        if (result.rowCount === 0) {
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
            body: JSON.stringify({ message: 'Stage assigned successfully' })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Error While assigning' })
        };
    } finally {
        await client.end();
    }
};