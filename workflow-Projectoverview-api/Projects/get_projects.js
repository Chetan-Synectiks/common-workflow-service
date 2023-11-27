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
         searchData =await client.query(`SELECT
            project_table.project_id,
            project_table.details AS project_details,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') AS completedUsecases,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'incomplete') AS incompletedUsecases
          FROM
            project_table
          LEFT JOIN
            usecase_table ON project_table.project_id = usecase_table.project_id
          WHERE
            usecase_table.details->>'start_date' >= $1
            AND usecase_table.details->>'end_date' <= $2
          GROUP BY
            project_table.project_id, project_table.details`,[data.start_date, data.end_date])
        
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