exports.getResourceList = async (event, context, callback) => {

    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    client.connect();


    let objReturn = {
        code: 200,
        message: "resource search successfully",
        type: "object",
        object: []
    };

    try {

        abc = await client.query(`select * from resource_table`);

        console.log(abc.rows);
        const ReturnedData = abc.rows.map(record => {

            let returnObj = {
                Resource_id: record.resource_id,
                Name: record.resource.name,
                Image: record.resource.image,
                Role: record.resource.role,
                Project_list: record.resource.projects,
                Email: record.resource.email
            }

            return returnObj;
        })

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