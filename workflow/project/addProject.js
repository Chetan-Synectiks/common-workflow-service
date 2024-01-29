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

    const body = JSON.parse(event.body);
    const { project_name, project_description, department, start_date , end_date,image_url } = body;

    try {
        await client
        .connect()
        .then(() => {
            console.log("Connected to the database");
        })
        .catch((err) => {
            console.log("Error connecting to the database. Error :" + err);
        });
       
        const project = {
            "name": project_name,
            "status": "completed",
            "project_manager": {
                "id" : "manager_id",
                "name" : "name",
                "image_url" : "url"
            },
            "project_description": project_description,
            "department": department,
            "project_icon_url": image_url,
            "current_stage": "",
            "start_date": start_date,
            "end_date": end_date,
            "budget": 250000,
            "updated_by": {
                "id" : "id",
                "name" : "name",
                "image_url" : "url",
                "time" : "time_stamp"
            }
        };

        const result = await client.query(
            `INSERT INTO projects_table (project)
             VALUES  ($1) RETURNING id as project_id,
             (project->>\'name\')::text as project_name `,
             [ JSON.stringify(project)]  
        );
        

        const insertedData = result.rows[0];

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                project_id: insertedData.project_id,
                project_name: insertedData.project_name
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
            }),
        };
    } finally {
        await client.end();
    }
};
