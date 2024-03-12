const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");
exports.handler = middy( async (event,context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const documentId = event.pathParameters?.id ?? null;
    const IdSchema = z.string().uuid({ message: "Invalid document id" });
    const isUuid = IdSchema.safeParse(documentId);
    if (!isUuid.success) {
        return {
            statusCode: 400,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: isUuid.error.issues[0].message,
            }),
        };
    }
    const deleteQuery = `delete from metadocs_table where id = $1`;
    const client = await connectToDatabase();
    try {
        const result = await client.query(deleteQuery, [documentId]);
        return {
            statusCode: 204,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({message:"document deleted"}),
        };
    } catch (error) {
        console.error("Error executing query", error);
        return {
            statusCode: 500,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                message: error.message,
                error: error,
            }),
        };
    } finally {
        await client.end();
    }
})
.use(authorize())
.use(errorHandler());