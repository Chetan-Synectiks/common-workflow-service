exports.addProject = async (event) => {
    const requestBody = JSON.parse(event.body);

    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    try {
        await client.connect();

        const result = await client.query(
            'INSERT INTO projects_table (project) VALUES ($1::jsonb) RETURNING id as project_id, (project->>\'name\')::text as project_name',[requestBody]  
        );

        const insertedData = result.rows[0];

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                project_id: insertedData.project_id,
                project_name: insertedData.project_name
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
            }),
        };
    } finally {
        await client.end();
    }
};
