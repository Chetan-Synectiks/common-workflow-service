const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { uploadToS3 } = require("./uploadDocs")

exports.handler = async (event) => {

    const task_id = event.pathParameters?.taskId;
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
    const { createdBy, doc_name, data } = JSON.parse(event.body);
	const upload = await uploadToS3(doc_name, data)
    const url = upload.link
    const type = upload.fileExtension
    const statusCode = upload.statusCode
    const currentTimestamp = new Date().toISOString();
    const metadocsObj = {
        createdBy: createdBy,
        doc_name: doc_name,
        data: data,
    };
    const metadocsSchema = z.object({
        createdBy: z.string().uuid(),
        doc_name: z.string(),
        data: z.string({
            message : "invalid string"
        })
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
        if(statusCode === 200 ){
        let query = `
					insert into metadocs_table
					(tasks_id, created_by, doc_name, doc_url, created_time, type) values ($1, $2, $3, $4, $5, $6)
					returning *`;
        let queryparam = [
            task_id,
            createdBy,
            doc_name,
            url,
            currentTimestamp,
            type
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
    }
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
};