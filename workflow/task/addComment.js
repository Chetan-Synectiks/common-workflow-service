const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod")
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer")
const { pathParamsValidator } = require("../util/pathParamsValidator")
const { bodyValidator } = require("../util/bodyValidator")
const { errorHandler } = require("../util/errorHandler")

const idSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" }),
});

const requestBodySchema = z.object({
    id: z.string().uuid({ message: "Invalid employee id" }),
    comment: z.string().min(1),
});
const resourceQuery = `
    SELECT
        id,
        r.first_name || '' || r.last_name AS name,
        r.image AS image_url
    FROM
        employee AS r
    WHERE
        id = $1`;

const updateQuery = `
    UPDATE tasks_table
    SET comments = comments || $1
    WHERE
        id = $2`;

exports.handler = middy(async (event) => {
    const task_id = event.pathParameters?.taskId ?? null;
    const { id, comment } = JSON.parse(event.body);
    const client = await connectToDatabase();
    const resourceQueryResult = await client.query(resourceQuery, [id]);
    const resource = resourceQueryResult.rows[0];
    let comments = JSON.stringify({
        resource: resource,
        comment: comment,
        created_date: new Date(),
        reply: {},
    });
    const updatequeryResult = await client.query(updateQuery, [
        comments,
        task_id,
    ]);
    await client.end()
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify("comment added"),
    }
})
    .use(authorize())
    .use(pathParamsValidator(idSchema))
    .use(bodyValidator(requestBodySchema))
    .use(errorHandler());
