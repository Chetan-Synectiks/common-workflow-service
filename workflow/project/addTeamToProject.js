const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
	const requestBody = JSON.parse(event.body);
		const { project_id, team_name, created_by_id, roles } = requestBody;

		const team = {
			team_name: team_name,
			created_by_id: created_by_id,
			created_time: new Date(),
			roles: roles,
		};
	const client = await connectToDatabase();
	const query = `
                update projects_table
                set project = jsonb_set(
                    project,
                    '{team}',
                    coalesce(project->'team', '{}'::jsonb) || $1::jsonb,
                    true
                )
                where 
                    id = $2`;
	try {
		const res = await client.query(query, [team, project_id]);
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Team added to the project",
			}),
		};
	} catch (error) {
		console.error("Error updating data:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Internal Server Error" }),
		};
	} finally {
		await client.end();
	}
};
