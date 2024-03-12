const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");
exports.handler = middy( async (event,context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const task_id = event.queryStringParameters?.id;
    const uuidSchema = z.string().uuid();
    const isUuid = uuidSchema.safeParse(task_id);
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
    const { created_by: created_by_id, doc_name, doc_url } = JSON.parse(event.body);
    const currentTimestamp = new Date().toISOString();
    const metadocsObj = {
        created_by: created_by_id,
        doc_name: doc_name,
        doc_url: doc_url,
        currentTimestamp: currentTimestamp
    };
    const metadocsSchema = z.object({
        created_by: z.string().uuid(),
        doc_name: z.string(),
        doc_url: z.string().url(),
        currentTimestamp: z.string().datetime()
    });
    const result = metadocsSchema.safeParse(metadocsObj);
    if (!result.success) {
        return {
            statusCode: 400,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: result.error.formErrors.fieldErrors,
            }),
        };
    }
    const client = await connectToDatabase();
    try {

        let query = `
					insert into metadocs_table
					(tasks_id, created_by, doc_name, doc_url, created_time) values ($1, $2, $3, $4, $5)
					returning *`;
        let queryparam = [
            task_id,
            created_by_id,
            doc_name,
            doc_url,
            currentTimestamp
        ];
        const result = await client.query(query, queryparam);
        return {
            statusCode: 200,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify(result.rows[0]),
        };
    } catch (error) {
        console.error("Error inserting data:", error);
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