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

    const project_id = event.queryStringParameters.project_id;
    const role = event.queryStringParameters.role;
    const resourceName = event.queryStringParameters.resource_name;

    try {
        await client
            .connect()
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error connecting to the database. Error :" + err);
            });

        const result = await client.query(
            `SELECT (project->'teams'->jsonb_object_keys(project->'teams')->'roles'->$1) AS roleResources
            FROM projects_table
            WHERE id = $2`,
            [role,project_id]
            );
        const roleResources = result.rows[0].roleresources
        const resourceQuery = `select resource->>'name' as name,
                                resource->>'image' as image_url,
                                resource->>'email' as email
                                from resources_table 
                                where id = $1`;
            // giving frequent timeout errors
        // let resourceArray = [];
        // for(const resource of roleResources){
        //     const result =await client.query(resourceQuery,[resource]);
        //     const name = result.rows[0].name
        //     const image = result.rows[0].image_url
        //     const email = result.rows[0].email
        //     const resourceObj = {
        //         id: resource,
        //         name: name,
        //         image_url: image,
        //         email: email
        //     };
        //     resourceArray.push(resourceObj)
        // }
        const resourceArray = await Promise.all(roleResources.map(( async resource => {
            const result = await client.query(resourceQuery, [resource]);
            const name = result.rows[0].name;
            const image = result.rows[0].image_url;
            const email = result.rows[0].email;
        
            return {
                id: resource,
                name: name,
                image_url: image,
                email: email
            };
        })));
        return {
            statuscode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(resourceArray)

        };

    } catch (error) {
        console.error('Error fetching resources:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
