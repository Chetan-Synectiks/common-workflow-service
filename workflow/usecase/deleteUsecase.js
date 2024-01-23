const { SFNClient, StopExecutionCommand } = require("@aws-sdk/client-sfn");

const sfnClient = new SFNClient();
const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
  const usecase_id = event.pathParameters?.usecase_id;
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

  try {
    const query = `SELECT arn FROM usecases_table WHERE id = $1`;
    const result = await client.query(query, [usecase_id]);
    executionArn = result.rows[0].arn;
    const input = {
      executionArn: executionArn,
    };
    const command = new StopExecutionCommand(input);
    const response = await sfnClient.send(command);
    const updateStatus =
      "UPDATE usecases_table SET usecase = jsonb_set(usecase, '{\"status\"}', ' \"Stop\"') WHERE id = $1";
    await client.query(updateStatus, [usecase_id]);

    return {
      statusCode: 200,
      body: JSON.stringify("usecase data updated successfully"),
    };
  } catch (error) {
    console.error("Error executing query", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  } finally {
    await client.end();
  }
};
