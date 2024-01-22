const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
	const projectId = event.queryStringParameters?.project_id ?? null;
	if (projectId == null || projectId === "") {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "ProjectId id is required",
			}),
		};
	}
	const client = await connectToDatabase();

	let query = `
                select 
                    p.project->'team'->'roles' as roles 
                from  
                	projects_table as p
                where p.id = $1::uuid`;
	try {
		const result = await client.query(query,[projectId]);
		const roles = result.rows[0].roles;
		const ress = await Promise.all( roles.map(async (role) => {
			const resourceIds = Object.values(role).flat();
			const resourceQuery = `
					select
						id as resource_id,
						resource->>'name' as resource_name,
						resource->>'image' as image_url,
						resource->>'email' as email
					from
					 resources_table 
					where 
						id IN (${resourceIds.map((id) => `'${id}'`).join(", ")})`;
			const ress = await client.query(resourceQuery);
			const roleName = Object.keys(role).at(0)
			return resource = {
				[roleName] : ress.rows
			}
		}));
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(ress),
		};
	} catch (e) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: e.message || "Internal server error",
			}),
		};
	}
};
