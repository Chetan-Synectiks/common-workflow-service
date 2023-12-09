exports.getResourcesByName = async (event) => {
    params = event.queryStringParameters.name;
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
        let res = await client.query(`select * FROM RESOURCE_TABLE WHERE LOWER(resource  ->> 'name') LIKE LOWER ( $1||'%')`, [params]);
        const extractedData = res.rows.map(row => ({
            resource_id: row.id,
            name: row.resource.name,
            imageurl: row.resource.imageurl
        }));

        return {
            statuscode: 200,
            body: JSON.stringify(extractedData)

        };

    }
    catch (error) {
        console.error("error", error)
        return {
            statuscode: 500,
            body: JSON.stringify("search error")
        };
    } finally {
        await client.end();
    }

};