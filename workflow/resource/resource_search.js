exports.resource_search = async (event) => {
    params = event.queryStringParameters.name;
    const { Client } = require('pg')
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "password"

    });
    try {
        await client.connect();
        let res = await client.query(`select * FROM RESOURCE_TABLE WHERE LOWER(resource_details -> 'resource' ->> 'name') LIKE LOWER ( $1||'%')`, [params]);
        const extractedData = res.rows.map(row => ({
            name: row.resource_details.resource.name,
            id: row.resource_details.id,
            project: row.resource_details.resource.project,
            imageurl: row.resource_details.resource.imageurl
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