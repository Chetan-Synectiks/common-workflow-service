// projects_usecase_overview Dashboard API

exports.get_projects = async (event, context, callback) => {
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

    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };

    try {
        const result = await client.query(`
            SELECT
                project_table.project_id,
                usecase_table.details->>'status' as status,
                project_table.details->>'name' as name
            FROM
                project_table
            JOIN
                usecase_table ON project_table.project_id = usecase_table.project_id
            WHERE
             usecase_table.details->>'start_date' >= $1
            AND usecase_table.details->>'end_date' <= $2`, [data.start_date, data.end_date]
        );

        let incompleteCount = [];
        let completedCount = [];
        let names = []
        result.rows.forEach(row => {
            if (row.status === 'incomplete') {
                incompleteCount++;
            } else if (row.status === 'completed') {
                completedCount++;
            }
            
            if (!names.includes(row.name)) {
                names.push(row.name);
            }
        });

        let returnObj = {
            incomplete: incompleteCount,
            completed: completedCount,
            names: names
        };
        
        objReturn.object = returnObj;
        await client.end();

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
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
