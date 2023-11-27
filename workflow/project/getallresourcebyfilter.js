exports.getallresourcebyfilter=async(event)=>
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
let res={
    status:200,
    result:"success",
    resource:[],
    project:[]
}
let status=event.queryStringParameters.status

try{
    const data = await client.query(`SELECT project->>'name' as name,project->>'startdate'as startdate,project->>'enddate' as duedate, project ->> 'resources'AS noofresources FROM project WHERE project ->> 'status' = $1`,[status]);
console.log("project",data.rows)
const nof=data.rows;//[{no:'[1,2]},{no:'[1,3]'}]
console.log(nof)
const len=nof.length;
res.project=data.rows
//Here we are getting resources ids as two different arrays like[1,2],[1,3] so here i wrote some logic to merge this arrays then only we can retrieve data from the resourcce table 
let k=0;
let rid=[]
for(let i=0;i<len;i++)
{
    for(let j=1;j<nof[i].noofresources.length;j++)
    {
        
        rid[k]=nof[i].noofresources[j];
        k++;
        j=j+2
    }

}
//after the logic we get array like[1,3,2]
const f=await client.query(`SELECT resource->>'name' as name,resource->>'currenttask' as currenttask,resource->>'usecase' as usecase FROM resource WHERE id = ANY (ARRAY[${rid}])`)
res.resource=f.rows
console.log("resource",f.rows)
client.end();
return {
    "statuscode":200,
     "body":JSON.stringify(res)
}
    
}
catch(e)
{
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