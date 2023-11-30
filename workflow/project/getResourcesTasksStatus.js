
exports.getResourcesTasksStatus = async (event, context, callback) => {
    const { Client } = require('pg');
  
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: ""
    });
  
    client.connect();
  
    let data = {};
  
    if (event.queryStringParameters) {
        data = event.queryStringParameters;
    }
    console.log(data);
  
    let objReturn = {
        code: 200,
        message: "Project search successful",
        type: "object",
        object: []
    };
  
    try {
        const result = await client.query(`
            SELECT
                tasks->>'status' AS status,
                tasks->>'end_date' AS end_date,
                tasks->>'start_date' AS start_date,
                tasks->>'assignee_id' AS assignee_id
            FROM
                usecase_table,
                LATERAL (
                    SELECT jsonb_array_elements(usecase->'stages'->'mock'->'tasks') AS tasks
                    UNION ALL
                    SELECT jsonb_array_elements(usecase->'stages'->'requirement'->'tasks') AS tasks
                ) AS all_tasks
                WHERE
                (tasks->>'start_date') >= $1
                AND (tasks->>'end_date') <= $2
                AND all_tasks.tasks->>'assignee_id' = $3`, [data.from_date, data.to_date, data.assignee_id]
        );
  
        let assigneeTasks = {
            assignee_id: data.assignee_id,
            completed_tasks: [],
            inprogress_tasks: [],
            pending_tasks: []
        };
  
        result.rows.forEach(row => {
            if (row.status === 'inprogress') {
                assigneeTasks.inprogress_tasks++;
            } else if (row.status === 'completed') {
                assigneeTasks.completed_tasks++;
            } else if (row.status === 'pending') {
                assigneeTasks.pending_tasks++;
            }
        });
  
        objReturn.object = [assigneeTasks];
        await client.end();
  
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    } catch (e) {
        objReturn.code = 400;
        objReturn.message = e.message || "An error occurred";
        await client.end();
  
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(objReturn)
        };
    }
  };