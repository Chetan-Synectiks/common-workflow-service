const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const { errorHandler } = require("../util/errorHandler");

const idSchema = z.object({
    docId: z.string().uuid(
        { message: "Invalid document id" })
})
const deleteQuery = `DELETE FROM metadocs_table WHERE id = $1`;

exports.handler = middy(async (event) => {
    const documentId = event.pathParameters?.docId ?? null;
    const client = await connectToDatabase();
    const result = await client.query(deleteQuery, [documentId]);
    await client.end()
    return {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Document deleted" }),
    };
})
    .use(authorize())
    .use(pathParamsValidator(idSchema))
    .use(errorHandler());
