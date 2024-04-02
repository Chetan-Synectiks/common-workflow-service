const { connectToDatabase } = require("../db/dbConnector")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const getWorkflows = `  
                        SELECT
                            w.id,
                            w.name,
							w.created_by,
                            w.metadata->'stages' AS stages,
							e.first_name,
							e.last_name,
							e.image,
							edg.designation
                        FROM                            
                        	workflows_table w
						LEFT JOIN
        					employee e ON e.id = w.created_by
						LEFT JOIN
							emp_detail ed ON e.id = ed.emp_id
						LEFT JOIN
        					emp_designation edg ON ed.designation_id = edg.id`
	const client = await connectToDatabase()
	const getWorkflowsResult = await client.query(getWorkflows)
	const response = getWorkflowsResult.rows.map(
		({
			id,
			name,
			created_by,
			first_name,
			last_name,
			designation,
			image,
			stages,
		}) => {
			return {
				id,
				name: name.split("@")[1].replace(/_/g, " "),
				stages,
				created_by: {
					id: created_by || "",
					first_name,
					last_name,
					designation,
					image: image || "",
				},
			}
		},
	)
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(response),
	}
})
	.use(authorize())
	.use(errorHandler())
