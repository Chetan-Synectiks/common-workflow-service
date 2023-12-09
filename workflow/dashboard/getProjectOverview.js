// projectoverview Dashboard API

exports.getProjectOverview = async (event, context, callback) => {
    
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

    client.connect();

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    try {
        const result = await client.query(`
        SELECT
            projects_table.id,
            usecases_table.usecase->>'status' as status
        FROM
            projects_table
        JOIN
        usecases_table ON projects_table.id = usecases_table.project_id
            WHERE projects_table.id = $1 
            AND usecases_table.usecase->>'start_date' >= $2
            AND usecases_table.usecase->>'end_date' <= $3`, [data.id, data.from_date, data.to_date]
        );

        let incompleteCount = [];
        let completedCount = [];

        result.rows.forEach(row => {
            if (row.status === 'incomplete') {
                incompleteCount++;
            } else if (row.status === 'completed') {
                completedCount++;
            }
        });

        let returnObj = {
            incomplete_usecases: incompleteCount,
            completed_usecases: completedCount,
        };
        
        await client.end();

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(returnObj)
        };
    } catch (e) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: e.message || "An error occurred" })
        };
    }
};