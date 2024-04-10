const { connectToDatabase } = require("../db/dbConnector");
const { SFNClient, CreateStateMachineCommand } = require("@aws-sdk/client-sfn");
const { generateStateMachine1 } = require("./generateStateMachine");
const { z } = require("zod");
const { v4: uuid } = require("uuid");

exports.handler = async (event) => {
  const { project_id, template_id } = JSON.parse(event.body);

  const projectIdSchema = z.string().uuid({ message: "Invalid project id" });
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

  const templateSchema = z.string({ message: "Invalid template id" });
  const tempValResult = templateSchema.safeParse(template_id);
  if (!tempValResult.success) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: tempValResult.error.issues[0].message,
      }),
    };
  }
  const client = await connectToDatabase();
  try {
    const metaData = {
      status: "inprogress",
    };
    const workflowQuery =
      "select workflow, name from master_workflow where id = $1";
    const workflpwResult = await client.query(workflowQuery, [template_id]);
    const stages = workflpwResult.rows[0].workflow.stages;
    const name = workflpwResult.rows[0].name;
    metaData.stages = stages;

    const projectQueryPromise = client.query(
      `select * from projects_table where id = $1`,
      [project_id]
    );
    const workflowQueryPromise = client.query(
      `SELECT COUNT(*) FROM workflows_table WHERE LOWER(SUBSTRING(name, POSITION('-' IN name) + 1)) = LOWER($1);;`,
      [name]
    );

    const [projectResult, workflowExists] = await Promise.all([
      projectQueryPromise,
      workflowQueryPromise,
    ]);
    if (workflowExists.rows[0].count > 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "workflow with same name already exists",
        }),
      };
    }
    const sfnClient = new SFNClient({ region: "us-east-1" });
    const newStateMachine = generateStateMachine1(stages);

    const random = uuid().split("-")[4];
    const workflowName = random + "@" + name.replace(/ /g, "_");
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
    if (commandResponse.$metadata.httpStatusCode != 200) {
      console.log(JSON.stringify(commandResponse));
    }
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    if (error.name == "StateMachineAlreadyExists") {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "workflow with same name already exists",
          error: error,
        }),
      };
    }
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
  } finally {
    await client.end();
  }
};
