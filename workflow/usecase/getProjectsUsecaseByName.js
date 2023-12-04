exports.getProjectsUsecaseByName = async (event) => {
    params = event.queryStringParameters.name;
    const { Client } = require('pg')
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflowapi",
        user: "postgres",
        password: ""

    });
    try {
        await client.connect();
        let res = await client.query(`select * FROM usecases_table WHERE LOWER(usecase ->> 'name') LIKE LOWER ( $1||'%')`, [params]);
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