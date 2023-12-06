exports.assignStage = async (event) => {
    const requestBody = JSON.parse(event.body);
    const { usecase_id, stage_name, assigned_to_id, assigned_by_id, updated_by_id, description } = requestBody;

    const { Client } = require('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "workflow",
        user: "postgres",
        password: "password"
    });

    try {
        await client.connect();
        const result = await client.query(`UPDATE usecase_table
                                SET usecase =
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    usecase,
                                                    '{stages, ${stage_name}, assigne_id}',
                                                    '"${assigned_to_id}"'
                                                ),
                                                '{stages, ${stage_name}, assigned_by_id}',
                                                '"${assigned_by_id}"'
                                            ),
                                            '{stages, ${stage_name}, updated_by_id}',
                                            '"${updated_by_id}"'
                                        ),
                                        '{stages, ${stage_name}, description}',
                                        '"${description}"'
                                    )
                                WHERE id = '${usecase_id}' AND usecase->'stages' ? '${stage_name}' `);
        if (result.rowCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No matching records found' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Stage assigned successfully' })
        };
    } catch (error) {
        console.error("error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error While assigning' })
        };
    } finally {
        await client.end();
    }
};