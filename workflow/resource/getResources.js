const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("@middy/core")
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")
const { optionalParamsValidator } = require("../util/optionalParamsValidator");

const querySchema = z
  .object({
    resource_id: z.string().uuid().optional(),
  })
  .nullable();

const resourcesQuery = `
            SELECT 
                e.id AS resource_id,
                e.first_name || ' ' || e.last_name AS employee_name,
                empd.designation AS employee_role,
                e.image AS resource_img_url,
                e.work_email AS resource_email
            FROM 
                employee e
            LEFT JOIN
                emp_detail d ON e.id = d.emp_id
            LEFT JOIN
                emp_designation empd ON empd.id = d.designation_id
            WHERE
				e.org_id = $1
            GROUP BY
                e.id,empd.designation,  
                e.first_name, 
                e.last_name, 
                e.image, 
                e.email`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const org_id = event.user["custom:org_id"]
	const projectFilter =
		event.queryStringParameters && event.queryStringParameters.project_id
	const client = await connectToDatabase()

	const queryParams = []
	let projectsQuery = `
            SELECT
                p.id,
                p.project->>'name' AS name,
                p.project->>'project_icon_url' AS project_icon_url,
                p.project->>'team' AS team
            FROM
                projects_table p
			WHERE
				p.org_id = $1`

	queryParams.push(org_id);
	if (projectFilter) {
		projectsQuery += `
                AND
                	id = $2`
		queryParams.push(projectFilter)
	}
	const resourcesResult = await client.query(resourcesQuery, [org_id])
	const projectsResult = await client.query(projectsQuery, queryParams)
	const outputData = processResourcesData(
		resourcesResult.rows,
		projectsResult.rows,
		projectFilter,
	)
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(outputData),
	}
})
	.use(authorize())
	.use(optionalParamsValidator(querySchema))
	.use(errorHandler())

function processResourcesData(resources, projects, projectFilter) {
	const outputData = []

	for (const resource of resources) {
		const resourceId = resource.resource_id
		const resourceName = resource.employee_name
		const resourceRole = resource.employee_role || ""
		const resourceImgUrl = resource.resource_img_url || ""
		const resourceEmail = resource.resource_email || ""

		const resourceProjects = projects.map(project => ({
			project_id: project.id,
			project_name: project.name,
			project_img_url: project.project_icon_url,
		}))
		if (projectFilter) {
			const filteredProjects = resourceProjects.filter(
				project => project.project_id === projectFilter,
			)
			if (filteredProjects.length > 0) {
				outputData.push({
					resource_id: resourceId,
					resource_name: resourceName,
					role: resourceRole,
					resource_img_url: resourceImgUrl,
					resource_email: resourceEmail,
					projects: filteredProjects,
				})
			}
		} else {
			outputData.push({
				resource_id: resourceId,
				resource_name: resourceName,
				role: resourceRole,
				resource_img_url: resourceImgUrl,
				resource_email: resourceEmail,
				projects: resourceProjects,
			})
		}
	}

	return outputData
}
