const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
	const role = event.queryStringParameters?.role ?? null;
	const name = event.queryStringParameters?.name ?? null;
	if (role == null || role === '') {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Resource role is missing",
			}),
		};
	}
	// if (name == null || name === '') {
	// 	return {
	// 		statusCode: 200,
	// 		headers: {
	// 			"Access-Control-Allow-Origin": "*",
	// 		},
	// 		body: JSON.stringify([]),
	// 	};
	// }
	const client = await connectToDatabase();
	let queryParams = [];
	queryParams.push(role);
	try {
		let query = `
                    select 
                        (r.id) as resource_id,
                        (r.resource->>'name') as resource_name,
                        (r.resource->>'image') as image_url,
                        (r.resource->>'email') as email
                    from 
                        resources_table as r
                    where 
                        LOWER((r.resource->>'role')) = LOWER($1)`;
		if (name != null) {
			query += `
                    and 
                        LOWER(resource ->> 'name') LIKE LOWER('%' || $2 || '%')`;
			queryParams.push(name);
		}
		const result = await client.query(query, queryParams);
		const resource = result.rows.map(
			({ resource_id, resource_name, image_url, email }) => ({
				resource_id,
				resource_name,
				image_url,
				email,
			})
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(resource)
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Internal Server Error",
				error: error.message,
			}),
		};
	} finally {
		await client.end();
	}
};
