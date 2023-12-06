exports.stageDetailsForCreatingUsecase = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "postgres"
    });

    client.connect();

    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }
    console.log(data);

    try {
        const result = await client.query(`SELECT
            stages_data.stage_name,
            stages_data.stage_value
        FROM
            projects_table,
        LATERAL jsonb_each(project->'stages') AS stages_data(stage_name, stage_value)
        WHERE projects_table.id = $1;`,[data.id]);

        await client.end();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(result.rows)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    }
};
