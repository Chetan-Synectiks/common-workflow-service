const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
    const usecase_id = event.pathParameters?.id ?? null;
    const usecaseIdSchema = z.string().uuid({message : "Invalid usecase id"})
    const isUuid = usecaseIdSchema.safeParse(usecase_id)
    if(!isUuid.success){
        return {
            statusCode: 400,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: isUuid.error.issues[0].message
            }),
        };
    }
    const client = await connectToDatabase();
    try {
        const query = `
            SELECT tasks_table.task ->> 'stage' as Stagenames,
             metadocs_table.doc_name ,
              metadocs_table.doc_url,
              metadocs_table.id
            FROM metadocs_table
            INNER JOIN tasks_table ON metadocs_table.tasks_id = tasks_table.id
            WHERE tasks_table.usecase_id = $1
        `;
        const { rows } = await client.query(query, [usecase_id]);
        const DocNamesByStage = [];
        rows.forEach(result => {
            const stage = result.stagenames;
            const id = result.id;
            const docName = result.doc_name;
            const Url = result.doc_url;
        
            if (!DocNamesByStage[stage]) {
                DocNamesByStage[stage] = [];
            }
            DocNamesByStage[stage].push({ docName, Url,id });
        });
        const resultArray = Object.entries(DocNamesByStage).map(([stage, documents]) => ({
            [stage]: documents.map(({ id,docName, Url }) => ({ id,docName, Url}))
        }));
        return {
            statusCode: 200,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify(resultArray),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
               "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({  error: e.message || "An error occurred",}),
        };
    } finally {
        await client.end();
    }
};
