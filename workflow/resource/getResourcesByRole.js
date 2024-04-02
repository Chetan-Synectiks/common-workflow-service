const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")
const { queryParamsValidator } = require("../util/queryParamsValidator")

const designationSchema = z.object({
	designation: z.string().min(3, {
		message: " designation must be at least 3 characters long",
	}),
})

const query = `
            SELECT 
                e.id AS emp_id,
                COALESCE(e.first_name || ' ' || e.last_name, '') AS resource_name,
                COALESCE(e.work_email, '') as work_email,
                COALESCE(e.image, '') AS image,
                d.designation  as designation
            FROM 
                emp_detail ed
            LEFT JOIN 
                employee e ON ed.emp_id = e.id
            LEFT join
                emp_designation d on ed.designation_id = d.id
            WHERE 
                LOWER(d.designation) = LOWER($1)
            AND
                e.org_id = $2`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const designationName = event.queryStringParameters?.designation ?? null
	const org_id = event.user["custom:org_id"]
	const client = await connectToDatabase()

	const result = await client.query(query, [designationName, org_id])
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(result.rows),
	}
})
	.use(authorize())
	.use(queryParamsValidator(designationSchema))
	.use(errorHandler())
