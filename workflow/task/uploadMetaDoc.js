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
    doc_name: z.string().min(1),
    doc_url: z.string().url({ message: "Invalid document URL" }),
});
const query = `
    INSERT INTO metadocs_table
        (tasks_id, created_by, doc_name, doc_url, created_time)
    VALUES 
        ($1, $2, $3, $4, $5)
    RETURNING *`;

exports.handler = middy(async (event) => {
    const task_id = event.pathParameters?.taskId;
    const { createdBy,doc_name, doc_url } = JSON.parse(event.body);
    const currentTimestamp = new Date().toISOString();
    const client = await connectToDatabase();
    const result = await client.query(query, [
        task_id,
        createdBy,
        doc_name,
        doc_url,
        currentTimestamp
    ]);
    await client.end()
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(result.rows[0]),
    };
})

    .use(authorize())
    .use(pathParamsValidator(idSchema))
    .use(bodyValidator(requestBodySchema))
    .use(errorHandler());