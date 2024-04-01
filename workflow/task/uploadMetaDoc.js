const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod")
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { pathParamsValidator } = require("../util/pathParamsValidator")
const { bodyValidator } = require("../util/bodyValidator")

const idSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" }),
});

const requestBodySchema = z.object({
    doc_name: z.string().min(1),
    doc_url: z.string().url({ message: "Invalid document URL" }),
});

exports.handler = middy(async (event) => {
    const task_id = event.pathParameters?.taskId;
    const { doc_name, doc_url } = JSON.parse(event.body);
    const currentTimestamp = new Date().toISOString();
    const createdBy = "13a7d5ff-64c2-4a6f-87da-82e5fb78ce8f";

    const client = await connectToDatabase();

    let query = `
					insert into metadocs_table
					(tasks_id, created_by, doc_name, doc_url, created_time) values ($1, $2, $3, $4, $5)
					returning *`;
    let queryparam = [
        task_id,
        createdBy,
        doc_name,
        doc_url,
        currentTimestamp
    ];
    const result = await client.query(query, queryparam);
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