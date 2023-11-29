exports.get_usecasedetails = async (event, context, callback) => {
 
    const { Client } = require('pg');
 
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "1234"
    });
    client.connect();
    let objReturn = {
        code: 200,
        message: "project search successfully",
        type: "object",
        object: []
    };
    try {

        const de=await client.query(`select id,details->'usecase'->'name'as name,details->'usecase'->'current_stage' as currentstage,details->'usecase'->'assignee_id' as assignedid,details->'usecase'->'stages' as stages ,details->'usecase'->'start_date' as usecase_startdate,details->'usecase'->'end_date' as usecase_enddate from usecase`)

        console.log(de.rows)
        let mock=0;
        let requirement=0;
        let test=0;
        let publish=0;
        let totalresources=0;
        console.log(de.rows.length)
        console.log(de.rows[0].stages.requirement.tasks.length)
        for(let i=0;i<de.rows.length;i++)
        {
            if (de?.rows[i]?.stages?.requirement?.tasks?.length) {
             requirement=de.rows[i].stages.requirement.tasks.length
              
            }
            
            if (de?.rows[i]?.stages?.mock?.tasks?.length) {
                 mock=de.rows[i].stages.mock.tasks.length
              
          }
            if (de?.rows[i]?.stages?.test?.tasks?.length) {
                 test=de.rows[i].stages.test.tasks.length
                
            } 
            if (de?.rows[i]?.stages?.publish?.tasks?.length) {
                 publish=de.rows[i].stages.publish.tasks.length
             
        } 
         totalresources=mock+requirement+test+publish
         de.rows.push({totaltask:totalresources})
        }
        

console.log(totalresources)
let usecasedetails = de.rows.map(row => ({
    id: row.id,
    name: row.name,
    assigned_id: row.assignedid,
    usecase_startdate: row.usecase_startdate,
    enddate: row.usecase_enddate,
    totalresources:row.totaltask
    
}));

return{"body":JSON.stringify(usecasedetails)} ;

client.end();
    }
    catch (e) {
 
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