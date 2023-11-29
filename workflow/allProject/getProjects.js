exports.getProjects=async(event)=>{
    
  const {Client}=require('pg')
  const client=new Client({
        host:"localhost",
        user:"postgres",
        database:"postgres",
        port:"5432",
        password:"postgres"
    })
    client.connect();

    let values=event.queryStringParameters
    let status;
    if(values){
        status=values.status
    }
    
    try{
        let usecase;
        if(status){
            usecase=await client.query(` SELECT
            project.id AS id,
            project.project->>'status' as project_status,
            project.project->>'project_icon' as projecticon,
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
        }
        else{
            usecase=await client.query(` SELECT
            project.id AS id,
            project.project->>'status' as project_status,
            project.project->>'project_icon' as projecticon,
            project.project->>'name' as name,
            jsonb_array_length(project.project->'resources') AS total_resources,
            COUNT(usecase_table.id) AS total_usecases
        FROM
            project
        LEFT JOIN
            usecase_table ON project.id = usecase_table.project_id
        GROUP BY
            project.id, project.project`)  
        }
 
        let projectsDetails = usecase.rows.map(row => ({
            id: row.id,
            name: row.name,
            total_usecases: row.total_usecases,
            project_status: row.project_status,
            total_resources: row.total_resources,
            projecticon:row.projecticon
        
        }));
    
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