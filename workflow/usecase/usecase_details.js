exports.get_usecasedetails = async (event, context, callback) => {
 
    const { Client } = require('pg');
 
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: ""
    });
    client.connect();
    let objReturn = {
        code: 200,
        message: "usecase search successfull",
        type: "object",
        object: []
    };
    try {

        const de = await client.query(`select id,usecase->'name' as name,usecase->'current_stage' as currentstage,usecase->'assignee_id' as assignedid,usecase->'stages' as stages ,usecase->'start_date' as usecase_startdate from usecase_table`);

        console.log(de.rows);

        let usecasedetails = de.rows.map(row => {
            let totalresources = 0;
            let currentStageEndDate = "";

            if (row.stages) {
                // Loop through each stage dynamically
                Object.keys(row.stages).forEach(stageKey => {
                    if (row.stages[stageKey]?.tasks?.length) {
                        totalresources += row.stages[stageKey].tasks.length;
                    }

                    // Check if the current stage matches the looped stage
                    if (row.currentstage === stageKey && row.stages[stageKey]?.tasks?.length) {
                        const lastTaskIndex = row.stages[stageKey].tasks.length - 1;
                        currentStageEndDate = row.stages[stageKey].tasks[lastTaskIndex].end_date;
                    }
                });
            }

            return {
                id: row.id,
                name: row.name,
                assigned_id: row.assignedid,
                usecase_startdate: row.usecase_startdate,
                totalresources: totalresources,
                currentStageEndDate: currentStageEndDate
            };
        });

        console.log("usecasedetails", usecasedetails);

        return {"body": JSON.stringify(usecasedetails)};
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e;
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(objReturn)
        };
    } finally {
        client.end();
    }
};
