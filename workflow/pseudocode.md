# Workflow Management

Welcome to the documentation for the upcoming APIs that will power our workflow management system. In this document, we'll explore the pseudocode for various APIs.

## Table of Contents

- [Workflow Management](#workflow-management)
- [Table of Contents](#table-of-contents)
- [Get the overview of projects](#get-the-overview-of-projects)
- [get no of completed and incomplete usecases for all projects between dates](#get-no-of-completed-and-incomplete-usecases-for-all-projects-between-dates)
- [get no of completed and incomplete usecases for a project between dates](#get-no-of-completed-and-incomplete-usecases-for-a-project-between-dates)
- [Get all resources for all projects](#get-all-resources-for-all-projects)
- [Get the resources of all projects with filters](#get-the-resources-of-all-projects-with-filters)
- [Get task status of a resource between two dates](#get-task-status-of-a-resource-between-two-dates)
- [Get task status for all resources between two dates](#get-task-status-for-all-resources-between-two-dates)
- [get-all-projects-with-filter-and-without-filter](#get-all-projects-with-filter-and-without-filter)
- [Get a list of resources](#get-a-list-of-resources)
- [Get all usecases with details](#get-all-usecases-with-details)
- [search usecase from the search bar](#search-usecase-from-the-search-bar)
- [Search All resource details based on starting letter](#search-all-resource-details-based-on-starting-letter)


### Common Logic For For All APIs

  1. Define a Lambda function handler that takes an event as a parameter.

  2. Import the PostgreSQL Client module.

  3. Create a new PostgreSQL Client instance database credentails.

  4. Attempt connection to database. Log success or error for the connection

  5. Parse request body data from the event object ( if there is a request body)

  6. Using the pg client create the SQL query required by the API in a try-catch block.

  7. On successfull query, return the data (if any) with a status code 200 and a success message.

  8. If there's an error during the database query, log the error and return a response with a status code 500 and a JSON body including an error message.

# Get the overview of projects

Retrieves the list of all the projects 

> Note: Filter by Status (Optional)

Method: GET

- Execute a SELECT query on the database based on the existence of the 'status' parameter.
      - If 'status' exists, filter projects by status.
      - If 'status' doesn't exist, retrieve all projects.

- Process the query result:
      - Initialize an empty object projectData to store processed project data.

- Iterate through each row in the result:
    - Extract project and usecase information.

    - Update projectData with the cumulative counts of total and completed tasks and usecases.

- Transform the projectData into a consistent structure.


> This Api may or may not need pagation support

```SQL
--- without filter ---
    SELECT
        project.id AS project_id,
        project.project AS project_data,
        usecase.id AS usecase_id,
        usecase.usecase AS usecase_data
    FROM project_table project
    JOIN usecase_table usecase ON project.id = usecase.project_id;

--- with filter by project status ---
    SELECT
        project.id AS project_id,
        project.project AS project_data,
        usecase.id AS usecase_id,
        usecase.usecase AS usecase_data
    FROM project_table project
    JOIN usecase_table usecase ON project.id = usecase.project_id
    WHERE project.project->>'status' = 'inprogress';
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
      "id": "uuid",
      "pending": "value",
      "in_progress": "value",
      "completed": "value"
},
```

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of a resource.

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for a resource between two dates
            SELECT
                tasks->>'status' AS status,
                tasks->>'end_date' AS end_date,
                tasks->>'start_date' AS start_date,
                tasks->>'assignee_id' AS assignee_id
            FROM
                usecase_table,
                LATERAL (
                    SELECT jsonb_array_elements(usecase->'stages'->'mock'->'tasks') AS tasks
                    UNION ALL
                    SELECT jsonb_array_elements(usecase->'stages'->'requirement'->'tasks') AS tasks
                ) AS all_tasks
            WHERE
                usecase_table.usecase->>'start_date' >= $1
                AND usecase_table.usecase->>'end_date' <= $2
                AND all_tasks.tasks->>'assignee_id' = $3`, [data.start_date, data.end_date, data.assignee_id]

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
      "id": "uuid",
      "pending": "value",
      "in_progress": "value",
      "completed": "value"
    },
    
```

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of all resources.

```SQL

-- Query to get the number of pending, in-progress, and completed tasks for all resources between two dates
            SELECT
                tasks->>'status' AS status,
                tasks->>'end_date' AS end_date,
                tasks->>'start_date' AS start_date,
                tasks->>'assignee_id' AS assignee_id
            FROM
                usecase_table,
                LATERAL (
                    SELECT jsonb_array_elements(usecase->'stages'->'mock'->'tasks') AS tasks
                    UNION ALL
                    SELECT jsonb_array_elements(usecase->'stages'->'requirement'->'tasks') AS tasks
                ) AS all_tasks
            WHERE
                usecase_table.usecase->>'start_date' >= $1
                AND usecase_table.usecase->>'end_date' <= $2`, [data.start_date, data.end_date]

```

# get-all-projects-with-filter-and-without-filter

Retrieves the list for all projects.

- Method: GET

-   Using the pg client create a SQL query for SELECT to get all the projects.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
select
project.id AS id,
  project.project->>'status' as project_status,
  project.project->>'project_icon' as projecticon,
  project.project->>'name' as name,
  jsonb_array_length(project.project->'resources') AS total_resources,
COUNT(usecase_table.id) AS total_usecases
  FROM
project
  LEFT JOIN
usecase_table ON project.id = usecase_table.project_id
  WHERE
project.project->>'status' = $1 
  GROUP BY
project.id, project.project

--- with pagination ---
select
project.id AS id,
  project.project->>'status' as project_status,
  project.project->>'project_icon' as projecticon,
  project.project->>'name' as name,
  jsonb_array_length(project.project->'resources') AS total_resources,
COUNT(usecase_table.id) AS total_usecases
  FROM
project
  LEFT JOIN
usecase_table ON project.id = usecase_table.project_id
  WHERE
project.project->>'status' = $1 
  GROUP BY
project.id, project.project
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```

# Get a list of resources

Retrieves a list of all resources or of a particular proejctand get resource details -> resource_id, resource_name, resource_img_url, role, list of projects and email.

> Note: Filter by project_id (Optional)

Method: GET

Extract query parameters from the event.

- Initialize a variable project_id and assign it the value of the 'project_id' parameter from the data.

- Check if project_id exists:
    - If true:
        - Execute a SELECT query to retrieve resources associated with the specified project_id.
        - Iterate through each resource record and retrieve project details for each associated project.
        - Assemble the response object for each resource, including resource details and associated project details.
    - If false:
        - Execute a SELECT query to retrieve all resources.
        - Iterate through each resource record and retrieve project details for each associated project.
        - Assemble the response object for each resource, including resource details and associated project details.
> This Api may or may not need pagation support

```SQL
--- without filter ---
    --- to retrive data from resource_table ---
        select * from resource_table;

    --- to retrive data from project table ---
        select id, project_table.project->>'name' as project_name, 
        project_table.project->>'project_img_url' as project_img_url 
        from project_table 
        where id = 1;


--- with filter by project_id ---
    --- to retrive data from resource_table ---
        select * from resource_table
        where resource_table.resource->'projects' @> $1::jsonb;
    --- to retrive data from project table ---
        select id, project_table.project->>'name' as project_name, 
        project_table.project->>'project_img_url' as project_img_url 
        from project_table 
        where id = 1;
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
# Search All resource details based on starting letter
 
Retrieves  without filtering.
 
Method: GET
 
Request:
 
Response: resource details(Id,name,image_url)
 
-   Using the pg client create a SQL query for a SELECT statment to get all rows in the resource table
 
 
> This Api may or may not need pagation support
 
```SQL

select * FROM RESOURCE_TABLE WHERE LOWER(resource  ->> 'name') LIKE LOWER ( $1||'%')

```