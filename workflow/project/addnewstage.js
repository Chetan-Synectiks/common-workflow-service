exports.addnewstage=async(event)=>
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

const newstage= event.body
const project_id=event.queryStringParameters.project_id

try{

   const update=await client.query(`UPDATE usecases_table
   SET usecase = jsonb_set(
       usecase,
       '{stages}',
       COALESCE(usecase->'stages', '{}'::jsonb) || $1::jsonb,
       true
   )
   WHERE project_id =$2`,[newstage,project_id])




client.end();  
return{
     
     "body": "success"

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