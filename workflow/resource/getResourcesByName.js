exports.getResourcesByName = async (event) => {
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