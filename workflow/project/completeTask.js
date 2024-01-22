const { connectToDatabase } = require("../db/dbConnector");
const { SFNClient, SendTaskSuccessCommand } = require("@aws-sdk/client-sfn");

exports.handler = async (event) => {
	const task_id = event.queryStringParameters?.task_id ?? null;
	if (task_id == null) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "task id is required",
			}),
		};
	}
	const client = await connectToDatabase();
	console.log("task_id", task_id);
	try {
		const result = await client.query(
			`SELECT 
                token
            FROM 
                tasks_table 
            WHERE
                id = $1`,
			[task_id]
		);

		const { token} = result.rows[0];
        const stepFunctionClient = new SFNClient({region : "us-east-1"});
		const input = {
			output: "1",
			taskToken: token,
		};
        const command = new SendTaskSuccessCommand(input);
        const respone = await stepFunctionClient.send(command)
        console.log("response :" ,JSON.stringify(respone))
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "task completed",
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: "Internal Server Error",
				message: error.message,
			}),
		};
	} finally {
		await client.end();
	}
};