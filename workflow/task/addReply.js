const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const { bodyValidator } = require("../util/bodyValidator");

const taskIdSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" }),
});

const replySchema = z.object({
    resource_id: z.string().uuid({ message: "Invalid employee id" }),
    comment: z.string(),
    commentIndex: z.number().min(0, {
        message: "commentIndex should be either 0 or greater than 0",
    }),
});

exports.handler = middy(async (event) => {
    const taskId = event.pathParameters?.taskId ?? null;
    const client = await connectToDatabase();
    const { resource_id, comment, commentIndex } = JSON.parse(event.body);
    const isUuid = taskIdSchema.safeParse(taskId);
    const isUuid1 = taskIdSchema.safeParse(resource_id);

    const newReply = {
        comment: comment,
        commentIndex: commentIndex,
    };
    const validate = replySchema.safeParse(newReply);

    const resourceQuery = `select id,r.first_name||''|| r.last_name as name,
                           r.image as image_url
                           from employee as r
                           where id = $1`;
    const resourceQueryResult = await client.query(resourceQuery, [resource_id]);
    const resource = resourceQueryResult.rows[0];
    let reply = JSON.stringify({
        resource: resource,
        comment: comment,
        created_date: new Date(),
    });
    const updatequery = ` UPDATE tasks_table 
                        SET comments = jsonb_set(
                            comments,
                            $1, 
                            $2, 
                            true 
                        )
                       WHERE id = $3;
                    `;

    const updatequeryResult = await client.query(updatequery, [
        `{${commentIndex}, reply}`,
        reply,
        taskId,
    ]);
    await client.end();
    return {
        statusCode: 200,
        body: JSON.stringify("updated reply success"),
    };

})
    .use(authorize())
    .use(pathParamsValidator(taskIdSchema))
    .use(bodyValidator(replySchema))
    .use(errorHandler());
