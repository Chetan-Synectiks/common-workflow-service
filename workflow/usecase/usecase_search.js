exports.usecase_search = async (event) => {
    params = event.queryStringParameters.name;
    const { Client } = require('pg')
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "1234"

    });
    try {
        await client.connect();
        let res = await client.query(`select * FROM usecase WHERE LOWER(details -> 'usecase' ->> 'name') LIKE LOWER ( $1||'%')`, [params]);
        const extractedData = res.rows.map(row => ({
            name: row.details.usecase.name,
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