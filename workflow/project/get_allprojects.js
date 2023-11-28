// Get all projects details
exports.get_allprojects= async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "postgres"
    });

    client.connect();

    let objReturn = {
        code: 200,
        message: "All projects details retrieved successfully",
        type: "object",
        object: []
    };

    try {
        const result = await client.query(`
            SELECT
                project_table.project_id AS id,
                project_table.details,
                project_table.details->>'status' as project_status,
                project_table.details->>'name' as name,
                jsonb_array_length(project_table.details->'resources') AS total_resources,
                COUNT(usecase_table.usecase_id) AS total_usecases
            FROM
                project_table
            LEFT JOIN
                usecase_table ON project_table.project_id = usecase_table.project_id
            GROUP BY
                project_table.project_id, project_table.details`
        );
        let projectsDetails = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            total_usecases: row.total_usecases,
            project_status: row.project_status,
            total_resources: row.total_resources,
            
        }));

        objReturn.object = projectsDetails;
        await client.end();

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
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
