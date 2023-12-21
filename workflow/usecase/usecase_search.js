const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {
    const name = event.queryStringParameters?.name?? null;
	if ( name == null || name == '' ) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: "The 'name' query parameters are required and must have a non-empty value."
            }),
        };
    }
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
           
        let res = await client.query(`select * FROM usecases_table WHERE LOWER(usecase ->> 'name') LIKE LOWER ( $1||'%')`, [name]);
        const extractedData = res.rows.map(row => ({
            name: row.usecase.name,
        }));

        return {
            "statuscode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(extractedData)

        };

    }
    catch (error) {
        console.error("error", error)
        return {
            "statuscode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify("search error")
        };
    } finally {
        await client.end();
    }

};
