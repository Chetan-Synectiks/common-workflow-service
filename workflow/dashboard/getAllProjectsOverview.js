// projects_usecase_overview Dashboard API

exports.getAllProjectsOverview = async (event, context, callback) => {
    const { Client } = require('pg');

    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    client.connect();

    data = {};

    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }

    try {
        const result = await client.query(`
            SELECT
                projects_table.id,
                usecases_table.usecase->>'status' as status,
                projects_table.project->>'name' as project_name,
                usecases_table.usecase->>'name' as usecase_name
            FROM
                projects_table
            JOIN
                usecases_table ON projects_table.id = usecases_table.project_id
            WHERE
                usecases_table.usecase->>'start_date' >= $1
                AND usecases_table.usecase->>'end_date' <= $2`, [data.from_date, data.to_date]
        );

        let projects = {};

        result.rows.forEach(row => {
            const projectName = row.project_name;

            if (!projects[projectName]) {
                projects[projectName] = {
                    project_name: projectName,
                    completed_usecases: 0,
                    incomplete_usecases: 0
                };
            }

            if (row.status === 'incomplete') {
                projects[projectName].incomplete_usecases++;
            } else if (row.status === 'completed') {
                projects[projectName].completed_usecases++;
            }
        });

        await client.end();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(projects)
        };
    } catch (e) {
        await client.end();

        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: e.message || "An error occurred" })
        };
    }
};