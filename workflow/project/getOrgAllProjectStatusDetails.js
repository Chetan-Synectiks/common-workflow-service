exports.getOrgAllProjectStatusDetails = async (event) => {
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
        const queryTotalProjects = "SELECT COUNT(*) FROM project_table;";
        const resultTotalProjects = await client.query(queryTotalProjects);

        const queryCompletedProjects = "SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'completed';";
        const resultCompletedProjects = await client.query(queryCompletedProjects);

        const queryInProgressProjects = "SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'inprogress';";
        const resultInProgressProjects = await client.query(queryInProgressProjects);

        const queryUnassignProjects = "SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'unassign';";
        const resultUnassignProjects = await client.query(queryUnassignProjects);

        return {
            statusCode: 200,
            body: JSON.stringify({
                //totalProjects: resultTotalProjects.rows[0].count,
                completedProjects: resultCompletedProjects.rows[0].count,
                inProgressProjects: resultInProgressProjects.rows[0].count,
                unassignedProjects: resultUnassignProjects.rows[0].count,
                //message: "Success"
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
