const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")
const { pathParamsValidator } = require("../util/pathParamsValidator")

const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid workflow id" }),
})

const query = `
			SELECT 
				* 
			FROM 
				workflows_table 
			WHERE 
				id = $1`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const id = event.pathParameters?.id

	const client = await connectToDatabase()

	const workflowQuery = await client.query(query, [id])
	const data = workflowQuery.rows[0]
	const res = {
		...data,
		name: data.name.split("@")[1].replace(/_/g, " "),
		arn: undefined,
	}
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(res),
	}
})
	.use(authorize())
	.use(pathParamsValidator(idSchema))
	.use(errorHandler())
