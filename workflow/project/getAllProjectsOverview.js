// projects_usecase_overview Dashboard API

exports.getAllProjectsOverview = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "postgres",
        user: "postgres",
        password: "postgres"
    });

    client.connect();
    
    data={}

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    let objReturn = {
        code: 200,
        message: "Project search successful",
        type: "object",
        object: []
    };

    try {
        const result = await client.query(`
            SELECT
                project_table.project_id,
                usecase_table.usecase->>'status' as status,
                project_table.project->>'name' as project_name,
                usecase_table.usecase->>'name' as usecase_name
            FROM
                project_table
            JOIN
                usecase_table ON project_table.project_id = usecase_table.project_id
            WHERE
                usecase_table.usecase->>'start_date' >= $1
                AND usecase_table.usecase->>'end_date' <= $2`, [data.start_date, data.end_date]
        );

        let projects = {};

        result.rows.forEach(row => {
            const projectName = row.project_name;

            if (!projects[projectName]) {
                projects[projectName] = {
                    project_name: projectName,
                    completed_usecases: [],
                    incomplete_usecases: []
                };
            }

            if (row.status === 'incomplete') {
                projects[projectName].incomplete_usecases++;
            } else if (row.status === 'completed') {
                projects[projectName].completed_usecases++;
            }
        });
        // Object.values
        objReturn.object = Object.values(projects);
        await client.end();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    }
};
