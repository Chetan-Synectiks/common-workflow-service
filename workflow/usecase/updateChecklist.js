const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const { bodyValidator } = require("../util/bodyValidator");

const idSchema = z.object({
  id: z.string().uuid({ message: "Invalid usecase id" }),
});
const checklistSchema = z.object({
    stage_name: z.string(),
    item_id: z.number(),
    checked: z.boolean(),
  });

exports.handler = middy(async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const usecase_id = event.pathParameters.id;
  const { stage_name, item_id, checked } = JSON.parse(event.body);
  const client = await connectToDatabase();
    const query = `
            UPDATE usecases_table
            SET usecase = jsonb_set(
             usecase,
             '{stages,0,"${stage_name}",checklist,${item_id - 1},checked}', 
              $1::jsonb
            )
            WHERE id = $2
            RETURNING *;
            `;
    const values = [checked, usecase_id];
    const result = await client.query(query, values);
    const updatedChecklist =
      result.rows[0]?.usecase?.stages[0]?.[stage_name]?.checklist[item_id - 1];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(updatedChecklist),
    };
})
  .use(authorize())
  .use(pathParamsValidator(idSchema))
  .use(bodyValidator(checklistSchema))
  .use(errorHandler());
