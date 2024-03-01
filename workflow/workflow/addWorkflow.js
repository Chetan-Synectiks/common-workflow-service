const { connectToDatabase } = require("../db/dbConnector");
const { SFNClient, CreateStateMachineCommand } = require("@aws-sdk/client-sfn");
const { generateStateMachine2 } = require("./generateStateMachine");
const { z } = require("zod");
const { v4: uuid} = require("uuid")

exports.handler = async (event) => {
	const { name, created_by_id, project_id, stages } = JSON.parse(event.body);
	const projectIdSchema = z.string().uuid({ message: "Invalid project id" });
	const nameVal = z
		.string()
		.regex(/^[^#%^&*}{;:"><,?\[\]`|@]+$/, {
			message: "name should not contain special symbols",
		})
		.min(3)
		.max(67)
		.safeParse(name);
	if (!nameVal.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: nameVal.error.issues[0].message,
			}),
		};
	}
	const isUuid = projectIdSchema.safeParse(project_id);
	if (!isUuid.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: isUuid.error.issues[0].message,
			}),
		};
	}
	const StageSchema = z.array(
		z.object({
			name: z
				.string({
					message: "name must be atleast 3 characters",
				})
				.min(3),
			tasks: z.array(z.string()),
			checklist: z.array(z.string()),
		}),
		{ message: "Invalid request body" }
	);
	const MetaDataSchema = z.object({
		status: z.string(),
		created_by: z.string().uuid({ message: "Invalid resource id" }),
		updated_by: z.string().uuid({ message: "Invalid resource id" }),
		stages: StageSchema,
	});
	const metaData = {
		status: "inprogress",
		created_by: created_by_id,
		updated_by: created_by_id,
		stages: stages,
	};
	const parseResult = MetaDataSchema.safeParse(metaData);
	if (!parseResult.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: parseResult.error.formErrors.fieldErrors,
			}),
		};
	}
	const sfnClient = new SFNClient({ region: "us-east-1" });
	const newStateMachine = generateStateMachine2(stages);

	const client = await connectToDatabase();
	try {
		const workflowExists = await client.query(
			`SELECT COUNT(*)
			 FROM workflows_table
			 WHERE
			 LOWER(SUBSTRING(name, POSITION('@' IN name) + 1)) = LOWER($1)
			 AND project_id = $2::uuid`,
			[name.replace(/ /g,"_"), project_id]
		);
		if (workflowExists.rows[0].count > 0) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "workflow with same name already exists in the project",
				}),
			};
		}
		const random = uuid().split('-')[4]
		const workflowName = random+"@"+name.replace(/ /g,"_");
		const input = {
			name: workflowName,
			definition: JSON.stringify(newStateMachine),
			roleArn: "arn:aws:iam::657907747545:role/backendstepfunc-Role",
		};
		const command = new CreateStateMachineCommand(input);
		const commandResponse = await sfnClient.send(command);
		metaData.created_time = new Date().toISOString();
		let query = `
					insert into workflows_table
					(name, arn, metadata, project_id) values ($1, $2, $3::jsonb, $4::uuid)
					returning *`;
		const result = await client.query(query, [
			workflowName,
			commandResponse.stateMachineArn,
			metaData,
			project_id,
		]);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				...result.rows[0],
				name : result.rows[0].name.split('@')[1].replace(/_/g," ")
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	}
};
