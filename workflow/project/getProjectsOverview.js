exports.getProjectsOverview = async (event, context, callback) => {

    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    client.connect();
    let data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }
    console.log(data.status)
    const filters = data;
    let keysArr = Object.keys(filters);
    let valueArr = Object.values(filters);

    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };

    try {
        if (JSON.stringify(data) === '{}') {
            abc = await client.query(`SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
        LEFT JOIN
        usecase_table ON project_table.project_id = usecase_table.project_id
        GROUP BY project_table.project_id;`);
        }
        else if (data.status) {
            for (let item of keysArr) {
                abc = await client.query(`SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
                    LEFT JOIN
                    usecase_table ON project_table.project_id = usecase_table.project_id
                    WHERE project_table.details-> $1 @> $2
                    GROUP BY project_table.project_id;`, [item, JSON.stringify(valueArr[keysArr.indexOf(item)])]);
            }
        }

        console.log(abc.rows);
        const ReturnedData = abc.rows.map(record => {

            let percentage;
            percentage = (record.completedusecases / record.totalusecases) * 100
            let returnObj = {
                project_id: record.project_id,
                project_name: record.details.name,
                status: record.details.status,
                total_usecases: record.totalusecases,
                completed_usecases: record.completedusecases,
                due_date: record.details.end_date,
                completed_tasks_percentage: percentage
            }
            console.log(returnObj);

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