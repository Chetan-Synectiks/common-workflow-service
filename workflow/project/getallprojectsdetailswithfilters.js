exports.handler=async(event)=>
{
    //vinay
const {Client}=require('pg')
const client=new Client({
    host:"localhost",
    user:"postgres",
    database:"vinay",
    port:"5432",
    password:"2402"

})
client.connect();

let status=event.queryStringParameters.status
try{
   const usecase=await client.query(` SELECT
   project.id AS id,
   project.project->>'status' as project_status,
   project.project->>'name' as name,
   jsonb_array_length(project.project->'resources') AS total_resources,
   COUNT(usecase_table.id) AS total_usecases
FROM
   project
LEFT JOIN
   usecase_table ON project.id = usecase_table.project_id
   WHERE
   project.project->>'status' = $1 
GROUP BY
   project.id, project.project`,[status])

   console.log("ww",usecase.rows)
   let projectsDetails = usecase.rows.map(row => ({
    id: row.id,
    name: row.name,
    total_usecases: row.total_usecases,
    project_status: row.project_status,
    total_resources: row.total_resources,
    
}));
    
    console.log("ww",usecase.rows)
    

client.end();
return{
     "statuscode":200,
     "body":JSON.stringify(projectsDetails)

} 
}
catch (e) {

   
    client.end();
    
    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin":"*"
        },
       "msg":"error"
    };

}

}