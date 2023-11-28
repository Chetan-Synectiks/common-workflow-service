exports.projectfilters = async (event) => {
    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "dashboard-db",
        user: "postgres",
        password: "Amar123$"
    });

    client.connect();

    try {
        // Create SQL query for getting total projects
        const queryTotalProjects = "SELECT COUNT(*) FROM projects;";
        const resultTotalProjects = await client.query(queryTotalProjects);

        // Create SQL query for getting completed projects
        const queryCompletedProjects = "SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'completed';";
        const resultCompletedProjects = await client.query(queryCompletedProjects);

        // Create SQL query for getting in-progress projects
        const queryInProgressProjects = "SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'inprogress';";
        const resultInProgressProjects = await client.query(queryInProgressProjects);

        // Create SQL query for getting unassigned projects
        const queryUnassignedProjects = "SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'unassigned';";
        const resultUnassignedProjects = await client.query(queryUnassignedProjects);

        // Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalProjects: resultTotalProjects.rows[0].count,
                completedProjects: resultCompletedProjects.rows[0].count,
                inProgressProjects: resultInProgressProjects.rows[0].count,
                unassignedProjects: resultUnassignedProjects.rows[0].count,
                message: "Success"
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message
            })
        };
    } finally {
        await client.end();
    }
};
