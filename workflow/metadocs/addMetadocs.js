const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {

    const id = event.queryStringParameters?.id;
    console.log(id);
    if (!id) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Missing Task Id query parameter' }),
        };
    }
    const requestBody = JSON.parse(event.body);
    const { created_by, doc_name, doc_url } = requestBody;

    const client = await connectToDatabase();
    try {
        const currentTimestamp = new Date();
        let query = `
					insert into metadocs_table
					(tasks_id, created_by, doc_name, doc_url, created_time) values ($1, $2, $3, $4, $5)
					returning *`;
        let queryparam = [
            id,
            created_by,
            doc_name,
            doc_url,
            currentTimestamp
        ];
        const result = await client.query(query, queryparam);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(result.rows[0]),
        };
    } catch (error) {
        console.error("Error inserting data:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message,
            }),
        };
    }
};


