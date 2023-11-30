exports.getProjects = async (event) => {
  const { Client } = require("pg");
  const client = new Client({
    host: "localhost",
    user: "postgres",
    database: "postgres",
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
        project_table.id AS id,
        project_table.project->>'status' as project_status,
        project_table.project->>'project_icon' as project_icon,
        project_table.project->>'name' as name,
        jsonb_array_length(project_table.project->'resources') AS total_resources,
        COUNT(usecase_table.project_id) AS total_usecases
    FROM
    project_table
    LEFT JOIN
        usecase_table ON project_table.id = usecase_table.project_id
        WHERE
        project_table.project->>'status' = $1 
    GROUP BY
        project_table.id, project_table.project`,
        [status]
      );
    } else {
      usecase = await client.query(`SELECT
      project_table.id AS id,
      project_table.project->>'status' as project_status,
      project_table.project->>'project_icon' as project_icon,
      project_table.project->>'name' as name,
      jsonb_array_length(project_table.project->'resources') AS total_resources,
      COUNT(usecase_table.project_id) AS total_usecases
  FROM
      project_table
  LEFT JOIN
      usecase_table ON project_table.id = usecase_table.project_id
  GROUP BY
      project_table.id, project_table.project`);
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
