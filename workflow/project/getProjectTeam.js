const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event) => {
	const projectId = event.pathParameters?.id ?? null;
	const projectIdSchema = z.string().uuid({message : "Invalid project id"})
    const isUuid = projectIdSchema.safeParse(projectId)
	if(!isUuid.success){
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: isUuid.error.issues[0].message
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
		console.log("roles ", result.rowCount)
		const roles = result.rows[0].roles;
		if(roles == null){
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify([]),
			};
		}
		const ress = await Promise.all( roles.map(async (role) => {
			const resourceIds = Object.values(role).flat();
			const resourceQuery = `
					select
						id as resource_id,
						resource->>'name' as resource_name,
						resource->>'image' as image_url,
						resource->>'email' as email
					from
					 employee 
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
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message : e.message,
				error : e
			}),
		};
	}
};
