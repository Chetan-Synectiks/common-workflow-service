exports.addProject = async (event, context, callback) => {
    event = JSON.parse(event.body)

    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "postgres"
    });
    client.connect();

    let objReturn = {
        code: 200,
        message: "New project created",
        type: "object",
        object: []
    };
    try {
        if (JSON.stringify(event) === '{}') {
            objReturn.code = 400
            objReturn.message = "body is null"
            client.end();
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify(objReturn)
            };
        } else {

            await client.query(`insert into projects_table (project) VALUES ($1::jsonb)`, [event]);
        }

        client.end();

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e;
        client.end();
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    }

};



