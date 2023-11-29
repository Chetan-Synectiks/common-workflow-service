# Workflow Management

Welcome to the documentation for the upcoming APIs that will power our workflow management system. In this document, we'll explore the pseudocode for various APIs.

## Table of Contents

- [Workflow Management](#workflow-management)
  - [Table of Contents](#table-of-contents)
- [Get All Projects](#get-all-projects)
- [Get all projects with status filter](#get-all-projects-with-status-filter)
- [get no of completed and incomplete usecases for all projects between dates](#get-no-of-completed-and-incomplete-usecases-for-all-projects-between-dates)
- [get no of completed and incomplete usecases for a project between dates](#get-no-of-completed-and-incomplete-usecases-for-a-project-between-dates)
- [Get all resources for all projects](#get-all-resources-for-all-projects)
- [Get the resources of all projects with filters](#get-the-resources-of-all-projects-with-filters)
- [Get task status of a resource between two dates](#get-task-status-of-a-resource-between-two-dates)
- [Get task status for all resources between two dates](#get-task-status-for-all-resources-between-two-dates)
- [Get all projects with details](#get-all-projects-with-details)
- [Get Resources List](#get-resources-list)
- [Get the all projects with filters](#get-the-all-projects-with-filters)
- [Get Resource List By Projects](#get-resource-list-by-projects)
- [Get all usecases with details](#get-all-usecases-with-details)
- [search usecase from the search bar](#search-usecase-from-the-search-bar)



# Get All Projects

Retrieves the list of all the projects without filtering.

Method: GET

Request: 

Response: List of projects

-   Using the pg client create a SQL query for a SELECT statment to get all rows in the project table

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
LEFT JOIN usecase_table ON project_table.project_id = usecase_table.project_id
GROUP BY project_table.project_id;

--- with pagination ---
SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
LEFT JOIN usecase_table ON project_table.project_id = usecase_table.project_id
GROUP BY project_table.project_id;
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)
```

# Get all projects with status filter

Retrieves the list of all the projects with status filter.The filter string is passed in the request body.

Method: GET

Request: status : string

Response: List of projects


-   Using the pg client create a SQL query using a WHERE clause thats filters projects based on filter string.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

``` SQL
--- without pagination ---

SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
LEFT JOIN usecase_table ON project_table.project_id = usecase_table.project_id
WHERE project_table.details-> 'status' @> 'filter_string'
GROUP BY project_table.project_id;

--- with pagination ---

SELECT project_table.*, COUNT(usecase_table) as totalUsecases, COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') as completedUsecases FROM project_table
LEFT JOIN usecase_table ON project_table.project_id = usecase_table.project_id
WHERE project_table.details-> 'status' @> 'filter_string'
GROUP BY project_table.project_id
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)

```

# get no of completed and incomplete usecases for all projects between dates

Retrieves the list of all the Projects without filtering.

Method : GET

- Using the pg client create a SQL query for a SELECT statment to get all rows in the Projects table

- Query the database to get all projects and their corresponding use cases that fall within the specified date range.

- Count the number of completed and incomplete use cases for each project.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT
   project_table.project_id,
   project_table.details->>'name' as name,
   usecase_table.details->>'status' as status
FROM
   project_table
JOIN
   usecase_table ON project_table.project_id = usecase_table.project_id
WHERE
   usecase_table.details->>'start_date' >= $1
AND usecase_table.details->>'end_date' <= $2

--- with pagination ---

SELECT
   project_table.project_id,
   project_table.details->>'name' as name,
   usecase_table.details->>'status' as status
FROM
   project_table
JOIN
   usecase_table ON project_table.project_id = usecase_table.project_id
WHERE
   usecase_table.details->>'start_date' >= $1
AND usecase_table.details->>'end_date' <= $2
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# get no of completed and incomplete usecases for a project between dates


Retrieves the list of a Projects with filtering.

Method : GET

- Using the pg client create a SQL query using a WHERE clause to get a rows in the Projects table

- Query the database to get a projects and their corresponding use cases that fall within the specified date range.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
SELECT
    project_table.project_id,
    usecase_table.details->>'status' as status
FROM
    project_table
 JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
WHERE project_table.project_id = $1 
AND usecase_table.details->>'start_date' >= $2
AND usecase_table.details->>'end_date' <= $3
--- with pagination ---

SELECT
    project_table.project_id,
    usecase_table.details->>'status' as status
FROM
    project_table
 JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
WHERE project_table.project_id = $1 
AND usecase_table.details->>'start_date' >= $2
AND usecase_table.details->>'end_date' <= $3
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# Get all resources for all projects

Retrieves the list of all resources for all projects.

- Method: GET

-   Using the pg client create a SQL query for SELECT to get all the resources.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

select resource->>'name' as name,resource->>'currenttask' as currenttask,resource->>'usecase' as resource,jsonb_array_length(resource->'usecase') AS usecase_count  from resource;

--- with pagination ---

select resource->>'name' as name,resource->>'currenttask' as currenttask,resource->>'usecase' as resource,jsonb_array_length(resource->'usecase') AS usecase_count  from resource;
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```


# Get the resources of all projects with filters

Retrieves the the list of all resources with filters like whether the status of project complete or incomplete

- Method: GET

-   Using the pg client create a SQL query using a WHERE clause thats filters resources based on filter string.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT project->>'name' as name,project->>'startdate'as startdate,project->>'enddate' as duedate, project ->> 'resources'AS noofresources FROM project
  WHERE status = 'filter_string';

--- with pagination ---

SELECT project->>'name' as name,project->>'startdate'as startdate,project->>'enddate' as duedate, project ->> 'resources'AS noofresources FROM project
  WHERE status = 'filter_string'
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

# Get Total Projects, Total Tasks, and Percentages

Retrieves the list of all the projects, tasks, and percentages.

- Method: GET

- Using the pg client, create SQL queries for SELECT to get total projects, total tasks, and percentages of completed, in-progress, and unassigned projects.

- If required, return DTO object instead of the entire project object in a list.

> This API may or may not need pagination support

``` 
SQL
--- without pagination ---

const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects");
const resultTotalProjects = queryTotalProjects.rows[0].count;

const queryCompletedProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'completed'");
const resultCompletedProjects = queryCompletedProjects.rows[0].count;

const queryUnassignedProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'unassigned'");
const resultUnassignedProjects = queryUnassignedProjects.rows[0].count;

const queryInProgressProjects = await client.query("SELECT COUNT(*) FROM projects WHERE project ->>'status' = 'inprogress'");
const resultInProgressProjects = queryInProgressProjects.rows[0].count;

const percentageCompleted = (resultCompletedProjects / resultTotalProjects) * 100;
const percentageUnassigned = (resultUnassignedProjects / resultTotalProjects) * 100;
const percentageInProgress = (resultInProgressProjects / resultTotalProjects) * 100;

const queryTotalTasks = await client.query("SELECT COUNT(*) FROM tasks");
const de = await client.query(`SELECT usecase, project_id FROM tasks`);

let resultTotalTasks = [];

for (let i = 0; i < de.rows.length; i++) {
    let mock1 = 0;
    let requirement1 = 0;
    let test1 = 0;
    let publish1 = 0;

    if (de?.rows[i]?.usecase?.stages?.mock?.tasks?.length) {
        mock1 = de.rows[i].usecase.stages.mock.tasks.length;
    }

    if (de?.rows[i]?.usecase?.stages?.requirement?.tasks?.length) {
        requirement1 = de.rows[i].usecase.stages.requirement.tasks.length;
    }

    if (de?.rows[i]?.usecase?.stages?.test?.tasks?.length) {
        test1 = de.rows[i].usecase.stages.test.tasks.length;
    }

    if (de?.rows[i]?.usecase?.stages?.publish?.tasks?.length) {
        publish1 = de.rows[i].usecase.stages.publish.tasks.length;
    }

    let totaltasks = mock1 + requirement1 + test1 + publish1;
    resultTotalTasks.push({ project_id: de.rows[i].project_id, totaltasks });
}


--- with pagination ---

// Include pagination logic if needed
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)# Get all projects with status filter
Retrive the no.of projects by filter completed/inprogress/unassigned

 - Method: GET

 -   Using the pg client create a SQL query for SELECT to get status projects.

 -   If required return DTO object instead of entire project object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

const queryFilteredProjects = `SELECT COUNT(*) FROM projects WHERE project ->> 'status' = '${filterString}';`;
--- with pagination ---

const queryFilteredProjects = `SELECT COUNT(*) FROM projects WHERE project ->> 'status' = '${filterString}';`;
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```
# Get task status of a resource between two dates

get no of pending,inprogress,completed tasks/substages of a particular resource.

Method : GET

Request : 
``` json
{
    "resource_id": "uuid",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
}
```
Response :

``` json 
{
  "pending": "value",
  "in_progress": "value",
  "completed": "value"
}
```

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of a resource.

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for a resource between two dates
SELECT
    COUNT(CASE WHEN task->>'status' = 'pending' THEN 1 END) AS pending_tasks,
    COUNT(CASE WHEN task->>'status' = 'completed' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN task->>'status' = 'in_progress' THEN 1 END) AS in_progress_tasks
FROM
    usecase_table,
    LATERAL jsonb_array_elements(details->'usecase'->'stages'->'requirement'->'tasks') AS task
WHERE
    task->>'assignee_id' =$1
    AND (task->>'start_date')::date BETWEEN $2::date AND $3::date
    AND (task->>'end_date')::date BETWEEN $2::date AND $3::date;
 
`, [data.resourceName, data.startDate, data.endDate]);

```

# Get task status for all resources between two dates

get no of pending,inprogress,completed tasks/substages of all resources.

Method : GET

Request : 

``` json
{
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
}
```
Response :

``` json 
{
  "resources": [
    {
      "id": "uuid",
      "pending": "value",
      "in_progress": "value",
      "completed": "value"
    },
    {
      "id": "uuid",
      "pending": "value",
      "in_progress": "value",
      "completed": "value"
    }
  ]
}
```

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of all resources.

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for all resources between two dates
SELECT
    resource_table.resource_id,
    resource_table.details AS resource_details,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'completed') AS completedStages,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'pending') AS pendingStages,
    COUNT(*) FILTER (WHERE usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'status' = 'inprogress') AS inprogressStages
FROM
    resource_table
LEFT JOIN
    usecase_table ON resource_table.resource_id = usecase_table.resource_id
WHERE
    resource_table.resource_id = $1
    AND usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'start_date' >= $2
    AND usecase_table.details->'usecase'->'stages'->'requirement'->'tasks'->>'end_date' <= $3
GROUP BY
    resource_table.resource_id, resource_table.details;
`,[data.start_date, data.end_date]);

```

# Get all projects with details

Retrieves the list for all projects.

- Method: GET

-   Using the pg client create a SQL query for SELECT to get all the projects.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT
   project_table.project_id AS id,
   project_table.details,
   project_table.details->>'status' as project_status,
   project_table.details->>'name' as name,
   jsonb_array_length(project_table.details->'resources') AS total_resources,
COUNT(usecase_table.usecase_id) AS total_usecases
FROM
    project_table
LEFT JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
GROUP BY
    project_table.project_id, project_table.details;

--- with pagination ---

SELECT
   project_table.project_id AS id,
   project_table.details,
   project_table.details->>'status' as project_status,
   project_table.details->>'name' as name,
   jsonb_array_length(project_table.details->'resources') AS total_resources,
COUNT(usecase_table.usecase_id) AS total_usecases
FROM
    project_table
LEFT JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
GROUP BY
    project_table.project_id, project_table.details;
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```

# Get Resources List

Retrieves the list of all the resources without filtering.

Method: GET

Request: 

Response: List of resources

-   Using the pg client create a SQL query for a SELECT statment to get all rows in the resource table

-   If required return DTO object instead of entire resource object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
select * from resource_table;

--- with pagination ---
select * from resource_table
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)
```

# Get the all projects with filters

Retrieves the the list of all projects with filters like whether the status of project complete or incomplete

- Method: GET

-   Using the pg client create a SQL query using a WHERE clause thats filters resources based on filter string.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

   SELECT project.id AS id, project.project->>'status' as project_status project.project->>'name' as name, jsonb_array_length(project.project->'resources') AS total_resources, COUNT(usecase_table.id) AS total_usecases FROM project LEFT JOIN usecase_table ON project.id = usecase_table.project_id WHERE project.project->>'status' = $1 GROUP BY project.id, project.project,[status]

--- with pagination ---

   SELECT project.id AS id, project.project->>'status' as project_status project.project->>'name' as name, jsonb_array_length(project.project->'resources') AS total_resources, COUNT(usecase_table.id) AS total_usecases FROM project LEFT JOIN usecase_table ON project.id = usecase_table.project_id WHERE project.project->>'status' = $1 GROUP BY project.id, project.project,[status]
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```
# Get Resource List By Projects

Retrieves the list of the resources with given projectName without filtering.

Method: GET

Request: 

Response: List of resources with given projectName

-   Using the pg client create a SQL query for a SELECT statment to get all rows in the resource table

-   If required return DTO object instead of entire resource object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
const result = await client.query(`SELECT * FROM resource WHERE resource->>'project' = $1`, [project_name]);


--- with pagination ---
const result = await client.query(`SELECT * FROM resource WHERE resource->>'project' = $1`, [project_name]);

ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)
```
# Get all usecases with details

get all uscases with details -> id, name,current_stage,usecase_assigned_to, no of resources,usecase_start_date,usecase_end_date.

Method : GET

Request : 

Response :

-   Using the pg client create a SQL query for a SELECT statment to get id, name,current_stage,usecase_assigned_to, no of resources,usecase_start_date,usecase_end_date.

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for a resource between two dates
select id,details->'usecase'->'name'as name,details->'usecase'->'current_stage' as currentstage,details->'usecase'->'assignee_id' as assignedid,details->'usecase'->'stages' as stages ,details->'usecase'->'start_date' as usecase_startdate,details->'usecase'->'end_date' as usecase_enddate from usecase

```
# search usecase from the search bar

search usecase name from search bar

Method : GET

Request : 

Response :

-   Using the pg client create a SQL query for a SELECT statment to search usecase name from search bar

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for a resource between two dates
select * FROM usecase WHERE LOWER(details -> 'usecase' ->> 'name') LIKE LOWER ( $1||'%')

```