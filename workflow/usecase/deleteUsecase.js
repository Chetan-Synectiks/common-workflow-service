const { SFNClient, StopExecutionCommand } = require("@aws-sdk/client-sfn");
const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
  const usecase_id = event.pathParameters?.id ?? null;
  if (!usecase_id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Missing usecase_id parameter" }),
    };
  }
  const client = await connectToDatabase();
  const stopdate = new Date().toISOString();
  const stop_date = JSON.stringify(stopdate);
  const sfnClient = new SFNClient({ region: "us-east-1" });
  const getarnQuery = `SELECT arn FROM usecases_table WHERE id = $1`;
  const updateStatusQuery = `
          UPDATE usecases_table
          SET usecase = jsonb_set(
            usecase,
            '{status}',
            '"Stop"',
            true
          ) || jsonb_set(
            usecase,
            '{stop_date}',
            $2::jsonb,
            true
          )
          WHERE id = $1
        `;
  await client.query("BEGIN");
  try {
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
      },
      body: JSON.stringify("usecase data updated successfully"),
    };
  } catch (error) {
    console.error("Error executing query", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  } finally {
    await client.end();
  }
};
