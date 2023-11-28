# Workflow Management

Welcome to the documentation for the upcoming APIs that will power our workflow management system. In this document, we'll explore the pseudocode for various APIs.

## Table of Contents

-   [Get All Projects](#get-all-projects)
-   [Get all projects with status filter](#get-all-projects-with-status-filter)
-   [Get All Projects](#Get-All-Projects-count-usecase-between-dates)
-   [Get All Projectsid](#Get-A-Projects-count-usecase-between-dates)
-   [Get all resources for all projects](#get-all-resources-for-all-projects)
-   [Get the resources with filters](#get-the-resources-of-all-projects-with-filters)
-   [Get Total Projects and Total Tasks](#get-total-projects-and-total-tasks)
-   [Get all projects with status filter](#get-all-projects-with-status-filter)


    ### Common Logic For For All APIs

    1. Define a Lambda function handler that takes an event as a parameter.

    2. Import the PostgreSQL Client module.

    3. Create a new PostgreSQL Client instance database credentails.

    4. Attempt connection to database. Log success or error for the connection

    5. Parse request body data from the event object ( if there is a request body)

    6. Using the pg client create the SQL query required by the API in a try-catch block.

    7. On successfull quey, return the data (if any) with a status code 200 and a success message.

    8. If there's an error during the database query, log the error and return a response with a status code 500 and a JSON body including an error message.

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
    project_table.details AS project_details,
    COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') AS completedUsecases,
    COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'incomplete') AS incompletedUsecases
FROM
    project_table
LEFT JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
WHERE
    usecase_table.details->>'start_date' >= $1
    AND usecase_table.details->>'end_date' <= $2
GROUP BY
    project_table.project_id, project_table.details;


--- with pagination ---

SELECT
    project_table.project_id,
    project_table.details AS project_details,
    COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') AS completedUsecases,
    COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'incomplete') AS incompletedUsecases
FROM
    project_table
LEFT JOIN
    usecase_table ON project_table.project_id = usecase_table.project_id
WHERE
    usecase_table.details->>'start_date' >= $1
    AND usecase_table.details->>'end_date' <= $2
GROUP BY
    project_table.project_id, project_table.details;
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
            project_table.details AS project_details,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') AS completedUsecases,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'incomplete') AS incompletedUsecases
        FROM
            project_table
        LEFT JOIN
            usecase_table ON project_table.project_id = usecase_table.project_id
        WHERE
            project_table.project_id = $1
            AND usecase_table.details->>'start_date' >= $2
            AND usecase_table.details->>'end_date' <= $3
        GROUP BY
            project_table.project_id, project_table.details
--- with pagination ---

SELECT
            project_table.project_id,
            project_table.details AS project_details,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'completed') AS completedUsecases,
            COUNT(*) FILTER (WHERE usecase_table.details->>'status' = 'incomplete') AS incompletedUsecases
        FROM
            project_table
        LEFT JOIN
            usecase_table ON project_table.project_id = usecase_table.project_id
        WHERE
            project_table.project_id = $1
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

#  Get Total Projects and Total Tasks
  Retrieves the list of all the projects and tasks. 
  
  - Method: GET

  -   Using the pg client create a SQL query for SELECT to get total projects and total tasks.

  -   If required return DTO object instead of entire project object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects");
        const resultTotalProjects = (queryTotalProjects);
const queryTotalTasks = await client.query("SELECT COUNT(*) FROM tasks");
        const resultTotalTasks = (queryTotalTasks);

--- with pagination ---

const queryTotalProjects = await client.query("SELECT COUNT(*) FROM projects");
        const resultTotalProjects = (queryTotalProjects);
const queryTotalTasks = await client.query("SELECT COUNT(*) FROM tasks");
        const resultTotalTasks = (queryTotalTasks);
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```
# Get all projects with status filter
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

