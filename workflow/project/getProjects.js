exports.getProjects = async (event) => {
  const { Client } = require("pg");
  const client = new Client({
    host: "localhost",
    user: "postgres",
    database: "workflow",
    port: "5432",
    password: "postgres",
  });
  client.connect();

  let values = event.queryStringParameters;
  let status;
  if (values) {
    status = values.status;
  }

  try {
    let usecase;
    if (status) {
      usecase = await client.query(
        `SELECT
        projects_table.id AS id,
        projects_table.project->>'status' as project_status,
        projects_table.project->>'project_icon' as project_icon,
        projects_table.project->>'name' as name,
        jsonb_array_length(projects_table.project->'resources') AS total_resources,
        COUNT(usecases_table.project_id) AS total_usecases
    FROM
        projects_table
    LEFT JOIN
        usecases_table ON projects_table.id = usecases_table.project_id
    WHERE
        projects_table.project->>'status' = $1 
    GROUP BY
        projects_table.id, projects_table.project`,
        [status]
      );
    } else {
      usecase = await client.query(`SELECT
      projects_table.id AS id,
      projects_table.project->>'status' as project_status,
      projects_table.project->>'project_icon' as project_icon,
      projects_table.project->>'name' as name,
      jsonb_array_length(projects_table.project->'resources') AS total_resources,
      COUNT(usecases_table.project_id) AS total_usecases
  FROM
      projects_table
  LEFT JOIN
      usecases_table ON projects_table.id = usecases_table.project_id
  GROUP BY
      projects_table.id, projects_table.project`);
    }

    let projectsDetails = usecase.rows.map((row) => ({
      id: row.id,
      name: row.name,
      total_usecases: row.total_usecases,
      project_status: row.project_status,
      total_resources: row.total_resources,
      project_icon_url: row.project_icon,
    }));

    client.end();
    return {
      statuscode: 200,
      body: JSON.stringify(projectsDetails),
    };
  } catch (e) {
    client.end();

    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      msg: "error",
    };
  }
};
