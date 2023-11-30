exports.getResources = async (event, context, callback) => {

    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    client.connect();

    let objReturn = {
        code: 200,
        message: "resource searched successfully",
        type: "object",
        object: []
    };
    const data = event.queryStringParameters;
    // console.log(data)
    let project_id;
    if (data) {
        project_id = data.project_id
    }


    try {
        if (project_id) {
            const resourceQueryResult = await client.query(`SELECT *
            FROM resource_table
            WHERE resource_table.resource->'projects' @> $1::jsonb;`, [project_id]);

            // console.log(resourceQueryResult.rows);
            for (const record of resourceQueryResult.rows) {

                const projects = record.resource.projects;

                const DataArray = [];

                for (const projectId of projects) {
                    const Result = await client.query(`select id, project_table.project->>'name' as project_name, project_table.project->>'project_img_url' as project_img_url from project_table where id = $1`, [projectId]);

                    //console.log('!!!!', Result.rows[0].project_name);

                    DataArray.push({
                        projectId: projectId,
                        project_name: Result.rows[0].project_name,
                        project_img_url: Result.rows[0].project_img_url
                    });
                }
                //console.log(DataArray);
                let returnObj = {
                    resource_id: record.resource_id,
                    resource_name: record.resource.name,
                    resource_img_url: record.resource.image,
                    Role: record.resource.role,
                    resource_email: record.resource.email,
                    projects: DataArray
                };

                objReturn.object.push(returnObj);
            }
        }
        else {
            const resourceQueryResult = await client.query(`select * from resource_table`);

            // console.log(resourceQueryResult.rows);

            for (const record of resourceQueryResult.rows) {

                const projects = record.resource.projects;

                const DataArray = [];

                for (const projectId of projects) {
                    const Result = await client.query(`select id, project_table.project->>'name' as project_name, project_table.project->>'project_img_url' as project_img_url from project_table where id = $1`, [projectId]);

                    //console.log('!!!!', Result.rows[0].project_name);

                    DataArray.push({
                        projectId: projectId,
                        project_name: Result.rows[0].project_name,
                        project_img_url: Result.rows[0].project_img_url
                    });
                }
                //console.log(DataArray);
                let returnObj = {
                    resource_id: record.resource_id,
                    resource_name: record.resource.name,
                    resource_img_url: record.resource.image,
                    Role: record.resource.role,
                    resource_email: record.resource.email,
                    projects: DataArray
                };

                objReturn.object.push(returnObj);
            }

        }


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
