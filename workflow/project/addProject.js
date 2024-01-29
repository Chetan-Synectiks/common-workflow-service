const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const { project_name, project_description, department, start_date , end_date,image_url } = body;
    const client = await connectToDatabase();
    try {
        const project = {
            name: project_name,
            status: "",
            project_manager: {
                id: "",
                name: "",
                image_url: ""
            },
            project_description: project_description,
            department: department,
            project_icon_url: image_url,
            current_stage: "",
            start_date: start_date,
            end_date: end_date,
            budget: "",
            updated_by: {
                id: "",
                name: "",
                image_url: "",
                timestamp: ""
            },
            workflows: [],
            team: {}
        };

        const result = await client.query(
            `INSERT INTO projects_table (project) VALUES ($1::jsonb) RETURNING *`,
            [project]
        );

        const insertedData = result.rows[0];
        project.id = insertedData.id;
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(project),
        };
    } catch (error) {
        console.error("Error:", error.message);

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

