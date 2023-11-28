exports.getprojectstasks = async (event) => {
    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "dashboard-db",
        user: "postgres",
        password: "Amar123$"
    });

    client.connect();
    resultTotalTasks = [];

    try {
        // Create SQL query for getting total projects
        const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects");
        const resultTotalProjects = queryTotalProjects.rows[0].count;

        // Create SQL query for getting completed projects
        const queryCompletedProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'completed'");
        const resultCompletedProjects = queryCompletedProjects.rows[0].count;

        // Create SQL query for getting unassigned projects
        const queryUnassignedProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'unassigned'");
        const resultUnassignedProjects = queryUnassignedProjects.rows[0].count;

        // Create SQL query for getting in-progress projects
        const queryInProgressProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'inprogress'");
        const resultInProgressProjects = queryInProgressProjects.rows[0].count;

        // Calculate percentage of completed projects
        const percentageCompleted = (resultCompletedProjects / resultTotalProjects) * 100;
        // Calculate percentage of unassigned projects
        const percentageUnassigned = (resultUnassignedProjects / resultTotalProjects) * 100;
        // Calculate percentage of in-progress projects
        const percentageInProgress = (resultInProgressProjects / resultTotalProjects) * 100;

        // Create SQL query for getting total tasks
        const de = await client.query(`SELECT usecase, project_id FROM tasks`);

        let mock1 = 0;
        let requirement1 = 0;
        let test1 = 0;
        let publish1 = 0;

        for (let i = 0; i < de.rows.length; i++) {
            let project_id = de.rows[i].project_id;

            if (de?.rows[i]?.usecase?.stages?.mock?.tasks?.length) {
                mock1 = de.rows[i].usecase.stages.mock.tasks.length;
            }

            if (de?.rows[i]?.usecase?.stages?.requirement?.tasks?.length) {
                requirement1 = de.rows[i].usecase.stages.requirement.tasks.length;
            }

            if (de?.rows[i]?.usecase?.stages?.test?.tasks?.length) {
                test1 = de.rows[i].usecase.stages.test.tasks.length;
            }

            if (de?.rows[i]?.usecase?.stages?.publish?.tasks?.length) {
                publish1 = de.rows[i].usecase.stages.publish.tasks.length;
            }

            let totaltasks = mock1 + requirement1 + test1 + publish1;
            resultTotalTasks.push({ project_id, totaltasks });
        }

        // Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalProjects: resultTotalProjects,
                totalTasks: resultTotalTasks,
                percentageCompleted1: percentageCompleted,
                percentageUnassigned2: percentageUnassigned,
                percentageInProgress3: percentageInProgress,
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
