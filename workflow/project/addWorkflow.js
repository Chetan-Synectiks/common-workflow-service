const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
	try {
		const client = await connectToDatabase();

		const requestBody = JSON.parse(event.body);
		const { name, created_by_id, stages } = requestBody;
		const workflow = {
			created_by_id: created_by_id,
			created_time: new Date().toISOString().split("T")[0],
			stages: stages,
		};
		console.log(client)
		let query = `
					insert into workflows_table
					(name, workflow) values ($1, $2::jsonb)
					returning *`;
		const result = await client.query(query, [
			name,
			workflow,
		]);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(result.rows[0]),
		};
	} catch (error) {
		console.error("Error updating data:", error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "Internal Server Error" }),
		};
	}
};
