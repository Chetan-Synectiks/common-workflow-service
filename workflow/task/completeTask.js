const { connectToDatabase } = require("../db/dbConnector")
const { SFNClient, SendTaskSuccessCommand } = require("@aws-sdk/client-sfn")
const { z } = require("zod")
const middy = require("@middy/core");
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")
const { pathParamsValidator } = require("../util/pathParamsValidator")

const idSchema = z.object({
    taskId: z.string().uuid({ message: "Invalid task id" }),
})

exports.handler = middy(async event => {
    const task_id = event.pathParameters?.taskId ?? null
    const client = await connectToDatabase()
    const updateQuery = `
                    update tasks_table
                    set task = jsonb_set(
                        task,
                        '{status}',
                        '"completed"')
                    where id = $1`
    const getTokenQuery = `
                    SELECT
                        token,usecase_id
                    FROM
                        tasks_table
                    WHERE
                        id = $1::uuid`
    await client.query("BEGIN")
    try {
        const tokenResult = await client.query(getTokenQuery, [task_id])
        console.log("tokenResult", tokenResult)
        const { token, usecase_id } = tokenResult.rows[0]
        const stepFunctionClient = new SFNClient({ region: "us-east-1" })
        const input = {
            output: JSON.stringify(usecase_id),
            taskToken: token,
        }
        const command = new SendTaskSuccessCommand(input)
        const updateResult = await client.query(updateQuery, [task_id])
        console.log("updateResult", updateResult)
        if (updateResult.rowCount > 0) {
            const respone = await stepFunctionClient.send(command)
            console.log("respone", respone)
        }
        await client.query("COMMIT")
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "task completed",
            }),
        }
    } catch (error) {
        await client.query("ROLLBACK")
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: error.message,
                error: error,
            }),
        }
    } finally {
        await client.end()
    }
})
    .use(pathParamsValidator(idSchema))
    .use(authorize())
    .use(errorHandler())
