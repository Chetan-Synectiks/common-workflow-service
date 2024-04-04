const { connectToDatabase } = require("../db/dbConnector");
const middy = require("@middy/core");
const { z } = require("zod");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { optionalParamsValidator } = require("../util/optionalParamsValidator");
const validStatusValues = ["unassigned", "completed", "inprogress"];
const Schema = z
  .object({
    status: z
      .string()
      .nullable()
      .refine((value) => value === null || validStatusValues.includes(value), {
        message: "Invalid status value",
      }),
	page: z.string().optional(),
  })
  .nullable();

exports.handler = middy(async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const org_id = event.user["custom:org_id"];
  let page = event.queryStringParameters?.page ?? null;
  if (page == null) {
    page = 1;
  }
  page = parseInt(page);
  const limit = 10;
  let offset = (page - 1) * 10;
  offset = Math.max(offset, 0);
  const status = event.queryStringParameters?.status ?? null;
  const client = await connectToDatabase();
  let query = `
                    select 
                        p.id as project_id,
                        p.project->>'name' as proejct_name,
                        p.project->>'image_url' as project_icon_url,
                        p.project->>'status' as status,
                        p.project->'team'->'roles' as roles,
                        COUNT(u.id) as total_usecases
                    from 
                        projects_table as p
                    left join 
                        usecases_table as u on p.id = u.project_id
					WHERE p.org_id = $1`;
  let queryparams = [];
  queryparams.push(org_id);
  if (status != null) {
    query += `
				AND 
                    p.project->>'status' = $2`;
    queryparams.push(status);
  }
  query += `
                    group by
                        p.id
					LIMIT 10 OFFSET ${offset}`;
  const result = await client.query(query, queryparams);
  const totalRecords = result.rowCount;
  const totalPages = Math.ceil(totalRecords / limit);
  const response = result.rows.map(
    ({
      project_id,
      proejct_name,
      project_icon_url,
      status,
      roles,
      total_usecases,
    }) => {
      let res = roles?.map((e) => Object.values(e)).flat();
      return {
        id: project_id,
        name: proejct_name,
        image_url: project_icon_url,
        status,
        total_resources: new Set(res?.flat()).size,
        total_usecases: parseInt(total_usecases),
      };
    }
  );
  await client.end();
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      totalPages: totalPages,
      currentPage: page,
      projects: response,
    }),
  };
})
  .use(authorize())
  .use(optionalParamsValidator(Schema))
  .use(errorHandler());
