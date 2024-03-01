const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
	const getWorkflows = `  
                        SELECT
                            id,
                            name,
                            metadata->'stages' AS stages
                        FROM                            
                        workflows_table`;
	const client = await connectToDatabase();
	try {
		const getWorkflowsResult = await client.query(getWorkflows);
		const response = getWorkflowsResult.rows.map(({ id, name, checklist, stages }) => {
			return {
				id,
				name : name.split('@')[1].replace(/_/g," "),
				checklist,
				stages,
			};
		});
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify(response),
		};
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
