exports.getresourcelistbyproject = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "dashboard-db",
        user: "postgres",
        password: "Amar123$"
    });

    client.connect();

    let objReturn = {
        code: 200,
        message: "Resource search successful",
        type: "object",
        object: []
    };

    try {
        const project_name = event.queryStringParameters.projectName;

        if (!project_name) {
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify({ "error": "Project name not provided" })
            };
        }
        console.log(project_name)
        const result = await client.query(`SELECT * FROM resource WHERE resource->>'project' = $1`, [project_name]);

        const ReturnedData = result.rows.map(record => {
            let returnObj = {
                Resource_id: record.id,
                Name: record.resource.name,
                Image: record.resource.image,
                Role: record.resource.role,
                Project: record.resource.project,
                Email: record.resource.email
            };

            return returnObj;
        });

        objReturn.object = ReturnedData;

        client.end();

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } catch (e) {
        console.error(e);

        objReturn.code = 500;
        objReturn.message = "Internal Server Error";
        client.end();

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    }
};
