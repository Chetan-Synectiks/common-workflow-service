exports.get_allresourcetask = async (event, context, callback) => {
 
    const { Client } = require('pg');
 
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: ""
    });
 
    client.connect();
 
    let data = {};
  
    if ( event.queryStringParameters) {
        data =  event.queryStringParameters;
    }
     let searchData;
    
    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };
 
    try {
        searchData = await client.query(`
        SELECT
    resource_table.resource_id,
    resource_table.details AS resource_details,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'completed') AS completedStages,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'pending') AS pendingStages,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'inprogress') AS inprogressStages
FROM
    resource_table
LEFT JOIN
    usecase_table ON resource_table.resource_id = usecase_table.resource_id
WHERE
    resource_table.resource_id = $1
    AND usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'start_date' >= $2
    AND usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'end_date' <= $3
GROUP BY
    resource_table.resource_id, resource_table.details;
`,[data.start_date, data.end_date]);
    
        objReturn.object = searchData.rows;
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