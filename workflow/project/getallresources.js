exports.getallresource=async(event)=>
{
const {Client}=require('pg')
const client=new Client({
    host:"localhost",
    user:"postgres",
    database:"vinay",
    port:"5432",
    password:"2402"

})
client.connect();
let result={
    resource:[],
    projecct:[]
    
}
try{
    const data=await client.query(`select resource->>'name' as name,resource->>'currenttask' as currenttask,resource->>'usecase' as resource,jsonb_array_length(resource->'usecase') AS usecase_count  from resource`);
const dt=await client.query(`select project->>'name' as pname, project->>'startdate' as startdate,jsonb_array_length(project->'resources') AS resources  from project`);

result.resource=data.rows,
result.projecct=dt.rows

client.end();
return{
     "statuscode":200,
     "body":JSON.stringify(result)

} //body=JSON.stringify(result)
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