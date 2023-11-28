exports.get_resourcetask = async (event, context, callback) => {
 
    const { Client } = require('pg');
 
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "1234"
    });
 
    client.connect();
 
    let data = {};
  
    if ( event.queryStringParameters) {
        data =  event.queryStringParameters;
    }
    //  let searchData;
    
    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };
 
    try {
const result = await client.query(`
SELECT
    COUNT(CASE WHEN task->>'status' = 'pending' THEN 1 END) AS pending_tasks,
    COUNT(CASE WHEN task->>'status' = 'completed' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN task->>'status' = 'in_progress' THEN 1 END) AS in_progress_tasks
FROM
    usecase_table,
    LATERAL jsonb_array_elements(details->'usecase'->'stages'->'requirement'->'tasks') AS task
WHERE
    task->>'assignee_id' =$1 
    AND (task->>'start_date')::date BETWEEN $2::date AND $3::date
    AND (task->>'end_date')::date BETWEEN $2::date AND $3::date;

`, [data.resourceName, data.startDate, data.endDate]);
        objReturn.object = result.rows;
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