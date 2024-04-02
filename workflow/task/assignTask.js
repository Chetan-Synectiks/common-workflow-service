const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");

const taskIdSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" })
});

const assignIdSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" })
});
const query = `
    UPDATE
        tasks_table
    SET
        assignee_id = $1
    WHERE
        id = $2::uuid`;

exports.handler = middy(async (event) => {
    const taskid = event.pathParameters?.taskId ?? null;
    const assigned_to_id = event.pathParameters?.resourceId ?? null;
    const client = await connectToDatabase();
    const update = await client.query(query, [
        assigned_to_id,
        taskid
    ]);
    await client.end();
    return {
        statusCode: 201,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "task assigned successfully" }),
    };
})
    .use(authorize())
    .use(pathParamsValidator(taskIdSchema, assignIdSchema))
    .use(errorHandler());
