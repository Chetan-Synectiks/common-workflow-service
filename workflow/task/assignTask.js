const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
exports.handler = async (event) => {
	const task = JSON.parse(event.body);
    const taskid = event.pathParameters?.id ?? null;
    const taskIdSchema = z.string().uuid({message : "Invalid task id"})
    const taskUuid = taskIdSchema.safeParse(taskid)
    if(!taskUuid.success){
        return {
            statusCode: 400,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: taskUuid.error.issues[0].message
            }),
        };
    }
    const assigned_to_id = event.pathParameters?.resource_id??null;
    const assignIdSchema = z.string().uuid({message : "Invalid resource id"})
    const assignUuid = assignIdSchema.safeParse(assigned_to_id)
    if(!assignUuid.success){
        return {
            statusCode: 400,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: assignUuid.error.issues[0].message
            }),
        };
    }
	const {
		start_date,
		end_date,
		comments,
	} = task;
	const taskUpdate = {
		status:"Inprogress",
		start_date: start_date,
		end_date: end_date,
		comments: comments,
	};
    const client = await connectToDatabase();
	try {
		let query = `
                    update
                        tasks_table 
                    set 
                        assignee_id = $1,
                        task = task || $2
                    where
                        id = $3::uuid`;
		const update = await client.query(query, [
			assigned_to_id,
			JSON.stringify(taskUpdate),
			taskid,
		]);
		if (update.rowCount === 0) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({ message: "No matching records found" }),
			};
		}
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "task assigned successfully" }),
		};
	} catch (e) {
		console.error("Error:", e);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "error while assigining task" }),
		};
	} finally {
		await client.end();
	}
};