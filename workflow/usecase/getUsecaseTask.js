const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
	const usecase_id = event.pathParameters?.id;

	const uuidSchema = z.string().uuid({ message: "Invalid Usecase Id" });
	const isUuid = uuidSchema.safeParse(usecase_id);

	if (!isUuid.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: isUuid.error.issues[0].message,
			}),
		};
	}

	const client = await connectToDatabase();
	const query = `
                SELECT
                    t.id as task_id,
                    t.task AS task,
                    t.assignee_id,
                    CONCAT(e.first_name, ' ', e.last_name) AS assignee_name,
                    e.image AS assignee_image,
                    edd.designation AS assignee_designation,
                    json_agg(
                        json_build_object(
                           'id', d.id,
                           'name', d.doc_name,
                           'doc_url', d.doc_url,
                           'created_time', d.created_time
                           )
                    ) AS docs
                FROM
                    tasks_table t
                LEFT JOIN
                    metadocs_table d ON d.tasks_id = t.id
                LEFT JOIN
                    employee e ON t.assignee_id = e.id
                LEFT JOIN   
                    emp_detail ed ON e.id = ed.emp_id
                LEFT JOIN
                    emp_designation edd ON edd.id = ed.designation_id
                WHERE
                    t.usecase_id = $1
                GROUP BY
                    t.id, t.task, t.assignee_id, CONCAT(e.first_name, ' ', e.last_name), e.image, edd.designation, d.id, ed.id`;
    const usecaseQuery = `
                        select 
                            usecase as usecase
                        from     
                            usecases_table
                        where id = $1::uuid
                        `;
	try {
        const usecaseRes = await client.query(usecaseQuery, [usecase_id])
		const result = await client.query(query, [usecase_id]);

		if (result.rows.length === 0) {
			return {
				statusCode: 404,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify([]),
			};
		}
        const usecaseData = usecaseRes.rows[0].usecase
		const tasksWithDocs = result.rows.map((row) => {
            console.log(JSON.stringify(row));
			let assignee;
			if (row.assignee_id !== null) {
				assignee = {
					id: row.assignee_id,
					image: row.image || "",
					name: row.assignee_name,
					designation: row.assignee_designation,
				};
			}
			return {
				id: row.task_id,
				name: row.task.name,
				status: row.task.status,
                stage: row.task.stage,
				assigned_to: assignee != undefined ? assignee : {},
				docs: row.docs
					.filter((doc) => doc.id !== null)
					.map((doc) => ({
						doc_name: doc.name,
						doc_id: doc.id,
						doc_url: doc.doc_url,
						created_time: doc.created_time,
					})),
			};
		});
        usecaseData.stages.forEach((stage) => {
            const a  = tasksWithDocs.filter((task) => task.stage == Object.keys(stage)[0] )
            stage[Object.keys(stage)[0]].tasks = a
          })

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(usecaseData),
		};
	} catch (error) {
		console.error("Error executing query:", error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
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
