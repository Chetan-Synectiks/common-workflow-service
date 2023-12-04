const { Client } = require('pg');

exports.addusecase = async (event) => {
    // Parse the incoming request body
    const requestBody = JSON.parse(event.body);

    // Extract data from the request body
    const { project_id, created_by_id, usecase_name, assigned_to_id, description } = requestBody;

    // PostgreSQL configuration
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "postgres"
    });

    try {
        // Connect to the PostgreSQL database
        await client.connect();

        // Insert data into the usecases_table
        const result = await client.query(
            'INSERT INTO usecases_table (project_id, usecase) VALUES ($1, $2) RETURNING *',
            [project_id, {
                name: usecase_name,
                usecase_assignee_id: assigned_to_id,
                description: description,
                created_by_id: created_by_id, // Added created_by_id to the usecase JSONB
            }]
        );

        // Extract the inserted data from the result
        const insertedData = result.rows[0];

        // Prepare the response
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                usecase_id: insertedData.id,
                project_id: insertedData.project_id,
                created_by_id: insertedData.usecase.created_by_id,
                usecase_name: insertedData.usecase.name,
                assigned_to_id: insertedData.usecase.usecase_assignee_id,
                description: insertedData.usecase.description,
            }),
        };

        return response;
    } catch (error) {
        // Handle errors
        console.error('Error inserting data:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        // Close the database connection
        await client.end();
    }
};
