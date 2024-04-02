const { SFNClient, StopExecutionCommand } = require("@aws-sdk/client-sfn");
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
  const usecase_id = event.pathParameters?.id ?? null;
  const client = await connectToDatabase();
  const stopdate = new Date().toISOString();
  const stop_date = JSON.stringify(stopdate);
  const sfnClient = new SFNClient({ region: "us-east-1" });
  const getarnQuery = `SELECT arn FROM usecases_table WHERE id = $1`;
  const updateStatusQuery = `   UPDATE usecases_table
                                SET usecase = jsonb_set(
                                  jsonb_set(
                                    usecase,
                                    '{status}',
                                    '"Stop"',
                                    true
                                  ),
                                  '{stop_date}',
                                  $2::jsonb,
                                  true
                                )
                                WHERE id = $1`;
  await client.query("BEGIN");
  const result = await client.query(getarnQuery, [usecase_id]);
  executionArn = result.rows[0].arn;
  const input = {
    executionArn: executionArn,
  };
  const command = new StopExecutionCommand(input);
  const updateResult = await client.query(updateStatusQuery, [
    usecase_id,
    stop_date,
  ]);
  if (updateResult.rowCount > 0) {
    const response = await sfnClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      await client.query("ROLLBACK");
    }
  }
  await client.query("COMMIT");
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify("usecase data updated successfully"),
  };
})

  .use(authorize())
  .use(pathParamsValidator(idSchema))
  .use(errorHandler());
