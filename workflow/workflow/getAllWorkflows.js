const { connectToDatabase } = require("../db/dbConnector")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")

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
        		emp_designation edg ON ed.designation_id = edg.id
			WHERE
				w.org_id = $1`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const org_id = event.user["custom:org_id"]

	const client = await connectToDatabase()
	const getWorkflowsResult = await client.query(getWorkflows,[org_id])
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
