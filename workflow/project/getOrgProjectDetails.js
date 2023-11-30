exports.getOrgProjectDetails = async (event) => {
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
    let totaltasks=0;

    try {
        
        const queryTotalProjects = await client.query("SELECT COUNT(*) FROM project_table");
        const resultTotalProjects = queryTotalProjects.rows[0].count;

       
        const queryCompletedProjects = await client.query("SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'completed'");
        const resultCompletedProjects = queryCompletedProjects.rows[0].count;

        const queryUnassignedProjects = await client.query("SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'unassigned'");
        const resultUnassignedProjects = queryUnassignedProjects.rows[0].count;

        const queryInProgressProjects = await client.query("SELECT COUNT(*) FROM project_table WHERE project ->>'status' = 'inprogress'");
        const resultInProgressProjects = queryInProgressProjects.rows[0].count;

        const percentageCompleted = (resultCompletedProjects / resultTotalProjects) * 100;
        const percentageUnassigned = (resultUnassignedProjects / resultTotalProjects) * 100;
        const percentageInProgress = (resultInProgressProjects / resultTotalProjects) * 100;

        const de = await client.query(`SELECT usecase, project_id FROM usecase_table`);

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

            totaltasks = mock1 + requirement1 + test1 + publish1;
            //resultTotalTasks.push({ project_id, totaltasks });
            
            console.log("LLL",totaltasks)
        }

        // Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalProjects: resultTotalProjects,
                totalTasks: totaltasks,
               
                percentageCompleted: percentageCompleted,
                //percentageUnassigned2: percentageUnassigned,
                //percentageInProgress3: percentageInProgress,
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
