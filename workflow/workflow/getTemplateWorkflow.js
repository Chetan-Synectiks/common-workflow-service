const { connectToDatabase } = require("../db/dbConnector")
const query = `  
			SELECT *
            FROM                            
            master_workflow WHERE id = $1`
exports.handler = async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const id = event.pathParameters?.id
	const client = await connectToDatabase()
	try{
	const workflowQuery = await client.query(query, [id])
    const data = workflowQuery.rows[0]
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify([data]),
	}
} catch (error) {
	console.error("Error executing query", error);
	return {
		statusCode: 500,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify({
			message: error.message,
			error: error,
		}),
	};
} finally {
	await client.end();
}
};
