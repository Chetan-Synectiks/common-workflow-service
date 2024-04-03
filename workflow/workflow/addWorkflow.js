const { connectToDatabase } = require("../db/dbConnector")
const { SFNClient, CreateStateMachineCommand } = require("@aws-sdk/client-sfn")
const { generateStateMachine1 } = require("./generateStateMachine")
const { z } = require("zod")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")
const { bodyValidator } = require("../util/bodyValidator")
const { v4: uuid } = require("uuid")

const bodySchema = z.object({
	name: z
		.string()
		.regex(/^[^-]*$/, {
			message: "name should not contain `-`",
		})
		.min(3),
	created_by_id: z.string().uuid({ message: "Invalid resource id" }),
	project_id: z.string().uuid({ message: "Invalid project id" }),
	stages: z.array(
		z.object({
			name: z
				.string({
					message: "name must be atleast 3 characters",
				})
				.min(3),
			tasks: z.array(z.string()),
			checklist: z.array(z.string()),
		}),
		{ message: "Invalid request body" },
	),
})

const projectQuery = `
            SELECT 
                * 
            FROM 
                projects_table 
            WHERE
                id = $1`

const workflowQuery = `
            SELECT 
                COUNT(*) 
            FROM 
                workflows_table 
            WHERE 
                LOWER(SUBSTRING(name, POSITION('-' IN name) + 1)) = LOWER($1)
			AND
				org_id = $2`

const insertQuery = `
            INSERT INTO 
                workflows_table
                (name, arn, metadata, project_id, created_by, org_id) 
            VALUES ($1, $2, $3::jsonb, $4::uuid, $5::uuid, $6::uuid)
            RETURNING *`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const org_id = event.user["custom:org_id"]
	const { name, created_by_id, project_id, stages } = JSON.parse(event.body)
	const metaData = {
		status: "inprogress",
		created_by: created_by_id,
		updated_by: created_by_id,
		stages: stages,
	}
	const sfnClient = new SFNClient({ region: "us-east-1" })
	const newStateMachine = generateStateMachine1(stages)
	const client = await connectToDatabase()
	const projectQueryPromise = client.query(projectQuery, [project_id])
	const workflowQueryPromise = client.query(workflowQuery, [name, org_id])

	const [projectResult, workflowExists] = await Promise.all([
		projectQueryPromise,
		workflowQueryPromise,
	])
	if (workflowExists.rows[0].count > 0) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "workflow with same name already exists",
			}),
		}
	}
	const random = uuid().split("-")[4]
	const workflowName = random + "@" + name.replace(/ /g, "_")
	const input = {
		name: workflowName,
		definition: JSON.stringify(newStateMachine),
		roleArn: "arn:aws:iam::657907747545:role/backendstepfunc-Role",
	}
	const command = new CreateStateMachineCommand(input)
	const commandResponse = await sfnClient.send(command)
	metaData.created_time = new Date().toISOString()
	const result = await client.query(insertQuery, [
		workflowName,
		commandResponse.stateMachineArn,
		metaData,
		project_id,
		created_by_id,
		org_id,
	])
	if (commandResponse.$metadata.httpStatusCode != 200) {
		console.log(JSON.stringify(commandResponse))
	}
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
	.use(bodyValidator(bodySchema))
	.use(errorHandler())
