exports.getOrgProjectDetails = async (event) => {
    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "Amar123$"
    });

    client.connect();
    resultTotalTasks = [];
    let totaltasks=0;

    try {
        
        const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects_table");
        const resultTotalProjects = queryTotalProjects.rows[0].count;

       
        const queryCompletedProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'completed'");
        const resultCompletedProjects = queryCompletedProjects.rows[0].count;

        const queryUnassignedProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'unassigned'");
        const resultUnassignedProjects = queryUnassignedProjects.rows[0].count;

        const queryInProgressProjects = await client.query("SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'inprogress'");
        const resultInProgressProjects = queryInProgressProjects.rows[0].count;

        const percentageCompletedProjects = (resultCompletedProjects / resultTotalProjects) * 100;
        const percentageUnassignedProjects = (resultUnassignedProjects / resultTotalProjects) * 100;
        const percentageInProgressProjects = (resultInProgressProjects / resultTotalProjects) * 100;

        const queryTotalTasks = await client.query(`
            SELECT COUNT(*) as total_tasks
            FROM tasks_table t
            JOIN usecases_table u ON t.usecase_id = u.id
        `);

        totaltasks = queryTotalTasks.rows[0].total_tasks;

        // Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalProjects: resultTotalProjects,
                totalTasks: totaltasks,
                percentageCompletedProjects: percentageCompletedProjects,
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
