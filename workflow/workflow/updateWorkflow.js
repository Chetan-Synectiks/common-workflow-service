const { connectToDatabase } = require("../db/dbConnector")
const { SFNClient, UpdateStateMachineCommand } = require("@aws-sdk/client-sfn")
const { generateStateMachine2 } = require("./generateStateMachine")
const { z } = require("zod")
const middy = require("@middy/core")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")
const { pathParamsValidator } = require("../util/pathParamsValidator")

const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid workflow id" }),
})
const StageSchema = z.object({
	name: z.string({ message: "Invalid stage name" }),
	tasks: z.array(z.string()),
	checklist: z.array(z.string()),
})
const MetaDataSchema = z.object({
	updated_by_id: z.string().uuid(),
	stages: z.array(StageSchema),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const id = event.pathParameters?.id
	const { updated_by_id, stages } = JSON.parse(event.body)
	const sfnClient = new SFNClient({ region: "us-east-1" })
	const client = await connectToDatabase()
	const workflowData = await client.query(
		`select arn, metadata from workflows_table where id = $1`,
		[id],
	)

	const metaData = workflowData.rows[0].metadata
	const newStateMachine = generateStateMachine2(stages)

	const input = {
		stateMachineArn: workflowData.rows[0].arn,
		definition: JSON.stringify(newStateMachine),
		roleArn: "arn:aws:iam::657907747545:role/backendstepfunc-Role",
	}
	const command = new UpdateStateMachineCommand(input)
	const commandResponse = await sfnClient.send(command)
	const resource = await client.query(
		`SELECT first_name,
					last_name,
                    image
            FROM employee
            WHERE id = $1`,
		[updated_by_id],
	)
	metaData.stages = stages
	metaData.updated_by = {
		id: updated_by_id,
		name: `${resource.rows[0].first_name} ${resource.rows[0].last_name}`,
		image_url: resource.rows[0].image || "",
	}
	metaData.updated_time = commandResponse.updateDate
	let query = `
            UPDATE workflows_table SET metadata = $1 WHERE id = $2
        	returning metadata->'stages' AS stages`

	const result = await client.query(query, [metaData, id])
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result.rows[0]),
	}
})
	.use(authorize())
	.use(errorHandler())
	.use(bodyValidator(MetaDataSchema))
	.use(pathParamsValidator(idSchema))
