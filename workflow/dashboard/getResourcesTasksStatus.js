const { connectToDatabase } = require("../db/dbConnector");
const middy = require("@middy/core");
const { z } = require("zod");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");
const { optionalParamsValidator } = require("../util/optionalParamsValidator");

const resourceIdSchema = z
  .object({
    resource_id: z.string().uuid().optional(),
  })
  .nullable();

exports.handler = middy(async (event) => {
  // context.callbackWaitsForEmptyEventLoop = false
  const org_id = event.user["custom:org_id"];
  const resourceId = event.queryStringParameters?.resource_id;

  // const fromDate = event.queryStringParameters?.from_date ?? null;
  // const toDate = event.queryStringParameters?.to_date ?? null;
  const client = await connectToDatabase();

  // if (fromDate != null && toDate != null) {
  //   queryParams.push(fromDate);
  //   queryParams.push(toDate);
  // } else {
  //   const dates = getDates();
  //   queryParams.push(dates.thirtyDaysAgo);
  //   queryParams.push(dates.currentDate);
  // }

  let query = 
			`SELECT
				r.id AS resource_id,
				CONCAT(r.first_name,' ',r.last_name) AS resource_name,
				COUNT(*) FILTER (WHERE t.task->>'status' = 'completed') AS completed,
				COUNT(*) FILTER (WHERE t.task->>'status' = 'inprogress') AS inprogress,
				COUNT(*) FILTER (WHERE t.task->>'status' = 'pending') AS pending
			FROM
				employee AS r
			LEFT JOIN
				tasks_table AS t ON r.id = t.assignee_id
			WHERE
				r.org_id =$1`;

  const queryParams = [];
  queryParams.push(org_id);

  if (resourceId != null) {
    query += `
            AND
                r.id = $2::uuid`;
    queryParams.push(resourceId);
  }
  // query += `
  //                 AND (t.task->>'start_date') <> ''
  //                 AND (t.task->>'end_date') <> ''
  //                 AND (t.task->>'start_date')::date >= $1::date
  //                 AND (t.task->>'end_date')::date <= $2::date`;
  query += `
            GROUP BY
                r.id`;
  const result = await client.query(query, queryParams);
  const resourcetasks = result.rows.map(
    ({ resource_id, resource_name, completed, inprogress, pending }) => ({
      resource_id,
      resource_name,
      completed_tasks: parseInt(completed),
      inprogress_tasks: parseInt(inprogress),
      pending_tasks: parseInt(pending),
    })
  );
  await client.end();
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(Object.values(resourcetasks)),
  };
})
  .use(authorize())
  .use(optionalParamsValidator(resourceIdSchema))
  .use(errorHandler());

function getDates() {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);
  return {
    currentDate: currentDate.toISOString().split("T")[0],
    thirtyDaysAgo: thirtyDaysAgo.toISOString().split("T")[0],
  };
}
