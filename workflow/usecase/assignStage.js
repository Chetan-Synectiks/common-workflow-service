const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");

const idSchema = z.object({
  id: z.string().uuid({ message: "Invalid usecase id" }),
});

exports.handler = middy(async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const requestBody = JSON.parse(event.body);
  const usecase_id = event.pathParameters?.id ?? null;
  const { stage_name, assigned_to_id, description } = requestBody;
  const assigned_date = new Date().toISOString();
  const client = await connectToDatabase();
  const result = await client.query(
    "SELECT usecase FROM usecases_table WHERE id = $1",
    [usecase_id]
  );
  if (result.rowCount === 0) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Usecase not found" }),
    };
  }
  const existingData = result.rows[0].usecase;
  existingData.stages.forEach((stageObj) => {
    const stageKey = Object.keys(stageObj)[0];

    if (stageKey === stage_name) {
      const stageData = stageObj[stageKey];
      console.log(stageData);

      stageData.assignee_id = assigned_to_id;
      if (!stageData.description) 
         stageData.description = description;
      if (!stageData.assigned_date)
         stageData.assigned_date = assigned_date;
    }
  });
  await client.query(
    `  UPDATE usecases_table
                               SET usecase = $1 WHERE id = $2 `,
    [existingData, usecase_id]
  );
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({ message: "Stage assigned successfully" }),
  };
})

  .use(authorize())
  .use(pathParamsValidator(idSchema))
  .use(errorHandler());
