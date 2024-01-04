# Workflow Management

Welcome to the documentation for the upcoming APIs that will power our workflow management system. In this document, we'll explore the pseudocode for various APIs.

## Table of Contents

- [Workflow Management](#workflow-management)
  - [Table of Contents](#table-of-contents)
    - [Common Logic For For All APIs](#common-logic-for-for-all-apis)
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
- [Get a usecase by name](#get-a-usecase-by-name)
- [search usecase from the search bar](#search-usecase-from-the-search-bar)
- [Add ProjectTeam to project](#add-projectteam-to-project)
- [delete a usecase of project](#delete-a-usecase-of-project)
- [Search All resource details based on starting letter](#search-all-resource-details-based-on-starting-letter)
- [Get Total Projects, Total Tasks, and Percentage of completed projects](#get-total-projects-total-tasks-and-percentage-of-completed-projects)
- [Get Total Projects With Status Completed,Inprogress,Unassigned Projects](#get-total-projects-with-status-completedinprogressunassigned-projects)
- [Add Project workflow to project](#add-project-workflow-to-project)
- [Assigning stage to a resource](#assigning-stage-to-a-resource)
- [Add new project](#add-new-project)
- [Get all stages and tasks for creating a usecase](#get-all-stages-and-tasks-for-creating-a-usecase)
- [Get the overview of projects](#get-the-overview-of-projects-1)
- [Add a new stage to the existing project](#add-a-new-stage-to-the-existing-project)
- [Assign task to a resource](#assign-task-to-a-resource)
- [Add a new usecase to a project](#add-a-new-usecase-to-a-project)
- [get the list view of tasks assigned to a resource](#get-the-list-view-of-tasks-assigned-to-a-resource)
- [To start task after clicking start button](#to-start-task-after-clicking-start-button)
- [Get resources by role](#get-resources-by-role)
- [assign task](#assign-task)
- [Add stage to project](#add-stage-to-project)
- [delete project](#delete-project)
- [delete stage from usecase](#delete-stage-from-usecase)
- [add resource](#add-resource)
- [Get a list of resources (list view)](#get-a-list-of-resources-list-view)
- [get projects overview](#get-projects-overview)

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

- Using the pg client create a SQL query using a WHERE clause to get a rows in the Projects table references project_id in the UseCases table.

- Initialize an empty object data to store query parameters from the event.

- Query the database to get all projects and their corresponding use cases that fall within the specified date range.

- Count the number of completed and incomplete use cases for each project.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT
    project_table.id,
    usecase_table.usecase->>'status' as status
FROM
    project_table
JOIN
    usecase_table ON project_table.id = usecase_table.project_id
WHERE 
    usecase_table.usecase->>'start_date' >= $2
    AND usecase_table.usecase->>'end_date' <= $3

--- with pagination ---

SELECT
    project_table.id,
    usecase_table.usecase->>'status' as status
FROM
    project_table
JOIN
    usecase_table ON project_table.id = usecase_table.project_id
WHERE 
    usecase_table.usecase->>'start_date' >= $2
    AND usecase_table.usecase->>'end_date' <= $3
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# get no of completed and incomplete usecases for a project between dates


Retrieves the list of a Projects with filtering.

Method : GET

- Using the pg client create a SQL query using a WHERE clause to get a rows in the Projects table references project_id in the UseCases table.

- Extract query parameters from the event and assign them to data.

- Select project IDs and use case statuses from the specified tables within the date range Use parameters from the data object for project ID, start_date, and end_date.

- Initialize counters for incomplete and completed UseCases.

- Check the status of each UseCases Increment the corresponding counter based on the usecase status.

- Create return object with counts of incomplete and completed UseCases.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT
    project_table.id,
    usecase_table.usecase->>'status' as status
FROM
    project_table
JOIN
    usecase_table ON project_table.id = usecase_table.project_id
WHERE project_table.id = $1 
    AND usecase_table.usecase->>'start_date' >= $2
    AND usecase_table.usecase->>'end_date' <= $3

--- with pagination ---

SELECT
    project_table.id,
    usecase_table.usecase->>'status' as status
FROM
    project_table
JOIN
    usecase_table ON project_table.id = usecase_table.project_id
WHERE project_table.id = $1 
    AND usecase_table.usecase->>'start_date' >= $2
    AND usecase_table.usecase->>'end_date' <= $3
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

 ```

# Get task status of a resource between two dates

Get the number of completed, inprogress and pending tasks of a resource in between dates

Method : GET

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of a resource.

```SQL

-- Query to get the required data from the both the tables
    SELECT t.*, r.resource->>'name' AS resource_name
            FROM tasks_table t
            INNER JOIN resources_table r ON t.assignee_id = r.id
            WHERE t.assignee_id = $1,
            [data.resource_id]  
```

# Get task status for all resources between two dates

Get the number of completed, inprogress and pending tasks of all resources in between dates

Method : GET

-   Using the pg client create a SQL query for a SELECT statment to get count of completed , inprogress, and pending tasks of all resources.

```SQL

-- Query to get the required data from the both the tables
       SELECT t.*, r.resource->>'name' AS resource_name
            FROM tasks_table t
            INNER JOIN resources_table r ON t.assignee_id = r.id

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

Method: GET

1. Define SQL queries to fetch data from 'resources_table' and 'projects_table'.
   - `const resourcesQuery = 'SELECT * FROM resources_table';`
   - `let projectsQuery = 'SELECT * FROM projects_table';`
   - If 'project_id' is provided, modify `projectsQuery` to filter by project_id.

2. Process the data using the processResourcesData function:
   - Pass 'resourcesResult.rows', 'projectsResult.rows', and 'project_id' to processResourcesData.
   - Receive processed data in outputData.


3. Define a function called processResourcesData:
   - Takes 'resources', 'projects', and 'projectFilter' as parameters.
   - Initialize an empty array called outputData.
   - Iterate over each resource in 'resources'.
   - Extract relevant information about the resource.
   - Filter and map projects related to the resource.
   - If 'projectFilter' is applied, filter projects based on 'project_id'.
   - Add resource details to 'outputData'.
   - Return 'outputData'.

```SQL
SELECT * FROM resources_table
SELECT * FROM projects_table
SELECT * FROM projects_table WHERE id = '${projectFilter}'
```

# Get all usecases with details

get all uscases with details id, name,current_stage,usecase_assigned_to, no of resources,usecase_start_date,usecase_enddate.

Method : GET

-   Using the pg client create a SQL query for a SELECT statment to get id, name,current_stage,usecase_assigned_to,usecase_start_date,usecase_end_date.

```SQL

-- Query to get the usecaseid,usecasename,currentstage,assignee_id,stages,usecasestart_date,usecaseend_date
            SELECT
                u.id AS usecase_id,
                u.usecase->>'name' AS name,
                u.usecase->>'current_stage' AS currentstage,
                u.usecase->>'start_date' AS usecase_startdate,
                u.usecase->>'end_date' AS usecase_enddate,
                u.usecase->>'usecase_assignee_id' AS assignedid,
                COUNT(DISTINCT t.assignee_id)+1 AS totalresources
            FROM usecases_table u
            LEFT JOIN tasks_table t ON u.id = t.usecase_id
            GROUP BY u.id

```
# Get a usecase by name
get all uscases with details id, name,current_stage,usecase_assigned_to, no of resources,usecase_start_date,current_stage_enddate.

Method : GET

-   Using the pg client create a SQL query for a SELECT statment to get id, name,current_stage,usecase_assigned_to,usecase_start_date.

```SQL

-- Query to get the usecaseid,usecasename,currentstage,assignee_id,stages,usecasestart_date,usecaseend_date
            SELECT
                u.id AS usecase_id,
                u.usecase->>'name' AS name,
                u.usecase->>'current_stage' AS currentstage,
                u.usecase->>'start_date' AS usecase_startdate,
                u.usecase->>'end_date' AS usecase_enddate,
                u.usecase->>'usecase_assignee_id' AS assignedid,
                COUNT(DISTINCT t.assignee_id)+1 AS totalresources
            FROM usecases_table u
            LEFT JOIN tasks_table t ON u.id = t.usecase_id
            WHERE u.project_id = $1 AND u.usecase->>'name' = $2
            GROUP BY u.id
        , [data.project_id, data.name]      

```
# search usecase from the search bar

search usecase name from search bar

Method : GET

-   Using the pg client create a SQL query for a SELECT statment to search usecase name from search bar

```SQL

-- Query to get the usecase list 
select * FROM usecases_table WHERE LOWER(usecase ->> 'name') LIKE LOWER ( $1||'%')`, [params]

```
# Add ProjectTeam to project  

createing a projectteam for a project based on projectId

Method : PUT

-   Using the pg client create a SQL query to update project with projectTeam

```SQL

-- Query to get the existing details of a project, later query to update the project column with teams object
SELECT id, project FROM projects_table WHERE id = $1, [projectId]

UPDATE projects_table SET project = $1 WHERE id = $2, [existingData.project, projectId]
```
# delete a usecase of project 

delete a usecase of project based on usecaseid

Method : DELETE

-   Using the pg client create a SQL query to DELETE usecase with usecaseid

```SQL

-- Query to delete a usecase 
 DELETE FROM tasks_table WHERE usecase_id = $1,[usecase_id]
 DELETE FROM usecases_table WHERE id = $1,[usecase_id]
```
# Search All resource details based on starting letter
 
Method: GET
 
- SELECT *: Retrieve all columns (*) from the RESOURCE_TABLE.
 
- FROM RESOURCE_TABLE: The table from which data will be retrieved.
 
- WHERE LOWER(resource ->> 'name'): Filter condition where the value stored in the name field of the    resource column is converted to lowercase.
 
- LIKE LOWER ($1 || '%'): Checks for partial matches where the lowercase name starts with a provided string  and is followed by any characters using the wildcard %.
 
- Filtered the using map method and displayed what we actually needed.(resource_id,name,imageurl)
 
 
```SQL
select * FROM resources_table WHERE LOWER(resource  ->> 'name') LIKE LOWER ( $1||'%')
 
````````````filering the data ``````````````
 
    extractedData = res.rows.map(row => ({
            resource_id:row.id,
            name: row.resource.name,
            imageurl: row.resource.imageurl
        }));
    ````````````````````````
 
 
```

# Get Total Projects, Total Tasks, and Percentage of completed projects

Retrieves the list of all the projects, tasks, and percentage of completed projects.

- Method: GET

- Using the pg client, create SQL queries for SELECT to get total projects, total tasks, and percentages of completed, in-progress, and unassigned projects.

- If required, return DTO object instead of the entire project and usecase object  in a list.

> This API may or may not need pagination support

```SQL 

--- without pagination ---

SELECT COUNT(*) FROM projects_table


SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'completed'


SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'unassigned'


SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'inprogress'


SELECT COUNT(*) as total_tasks
FROM tasks_table t
JOIN usecases_table u ON t.usecase_id = u.id
      


--- with pagination ---

// Include pagination logic if needed
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)
```

# Get Total Projects With Status Completed,Inprogress,Unassigned Projects
Retrieves the list of completed,inprogress,unassigned projects.

- Method: GET

- Using the pg client, create SQL queries for SELECT to get completed, in-progress, and unassigned projects.

- If required, return DTO object instead of the entire project and usecase object  in a list.

> This API may or may not need pagination support

```SQL
--- without pagination ---


 SELECT COUNT(*) FROM projects_table


SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'completed'

SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'inprogress'
 
SELECT COUNT(*) FROM projects_table WHERE project ->>'status' = 'unassign'


--- with pagination ---

// Include pagination logic if needed
ORDER BY id
LIMIT 10
OFFSET page_key; (provided in the request)
```
# Add Project workflow to project  
 
createing a project workflow for a project based on projectId
 
Method : PUT
 
-   Using the pg client create a SQL query to update project with project workflow
 
```SQL
 
-- Query to get the existing details of a project, later query to update the project column with workflow object
SELECT id, project FROM projects_table WHERE id = $1, [projectId]
 
UPDATE projects_table SET project = $1 WHERE id = $2, [existingData.project, projectId]
```

# Assigning stage to a resource
 
Method: PUT
 
```SQL
                        UPDATE usecases_table
                                SET usecase =
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    usecase,
                                                    '{workflow,  ${stage_name} , assigne_id}',
                                                    $1::jsonb
                                                ),
                                                '{workflow, ${stage_name}, assigned_by_id}',
                                                $2::jsonb
                                            ),
                                            '{workflow, ${stage_name}, updated_by_id}',
                                            $3::jsonb
                                        ),
                                        '{workflow, ${stage_name}, description}',
                                        $4::jsonb
                                    )
                                WHERE id = $5 AND usecase->'workflow' ? $6 

                        
```
# Add new project

Retrieves the list of a Projects with filtering.

Method : post

- Using the pg client create a SQL query using Parse the event body as JSON.

- Check if the event body is empty and return an error response if so.

- Insert the new project into the projects_table

- Return a successful response with a message indicating a new project creation or handle errors and return an error response.


> This Api may or may not need pagation support

```SQL
--- without pagination ---

insert into projects_table (project) VALUES ($1::jsonb)

--- with pagination ---

insert into projects_table (project) VALUES ($1::jsonb)
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# Get all stages and tasks for creating a usecase


Retrieves the list of a Projects with filtering.

Method : GET

- Using the pg client create a SQL query using a WHERE clause to get a rows in the Projects table.

- Extract query parameters from the event and assign them to data.

- Execute a PostgreSQL query to retrieve stage details for a given project ID using jsonb_each to unnest the stages data.


- Initialize counters for incomplete and completed UseCases.

- Check the status of each UseCases Increment the corresponding counter based on the project.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT
            stages_data.stage_name,
            stages_data.stage_value
        FROM
            projects_table,
        LATERAL jsonb_each(project->'stages') AS stages_data(stage_name, stage_value)
        WHERE projects_table.id = $1;

--- with pagination ---

SELECT
    stages_data.stage_name,
    stages_data.stage_value
FROM
    projects_table,
    LATERAL jsonb_each(project->'stages') AS stages_data(stage_name, stage_value)
WHERE projects_table.id = $1;
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# Get the overview of projects

Retrieves the the list of all resources of a projects with filters like whether the status of project complete or incomplete

- Method: GET

-   Using the pg client create a SQL query using a WHERE clause thats filters resources based on filter string.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
SELECT p.id AS project_id, p.project->>'name' AS project_name, p.project->>'project_manager' AS manager,( SELECT COALESCE(SUM(COALESCE(JSONB_ARRAY_LENGTH(value->'tasks'), 0)), 0)FROM JSONB_EACH(project->'stages')) AS total_tasks,p.project->>'start_date' AS startdate,p.project->>'end_date' AS duedate,r.id AS resource_id,r.resource->'current_task'->>'task_name' AS currenttaskFROM
projects_table p JOIN tasks_table t ON p.id = t.project_id JOIN resources_table r ON t.assignee_id = r.id WHERE
r.resource->>'role' = 'Manager' AND p.project->>'status'=$1


--- with pagination ---
SELECT p.id AS project_id, p.project->>'name' AS project_name, p.project->>'project_manager' AS manager,( SELECT COALESCE(SUM(COALESCE(JSONB_ARRAY_LENGTH(value->'tasks'), 0)), 0)FROM JSONB_EACH(project->'stages')) AS total_tasks,p.project->>'start_date' AS startdate,p.project->>'end_date' AS duedate,r.id AS resource_id,r.resource->'current_task'->>'task_name' AS currenttaskFROM
projects_table p JOIN tasks_table t ON p.id = t.project_id JOIN resources_table r ON t.assignee_id = r.id WHERE
r.resource->>'role' = 'Manager' AND p.project->>'status'=$1
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```

# Add a new stage to the existing project

 Retrieves the the list of all projects with filters like whether the status of project complete or incomplete
 
- Method: GET

-   Using the pg client create a SQL query using a WHERE clause thats filters resources based on filter string.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT project->>'name' as name,project->>'startdate'as startdate,project->>'enddate' as duedate, project ->> 'resources'AS noofresources FROM projects_table
  WHERE status = 'filter_string';

--- with pagination ---

SELECT project->>'name' as name,project->>'startdate'as startdate,project->>'enddate' as duedate, project ->> 'resources'AS noofresources FROM projects_table
  WHERE status = 'filter_string'
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# Assign task to a resource

It assign a task to a resource for a task.

- Method: PUT

-   Using the pg client create a SQL query using a WHERE clause id add a task to the resource.

-   If required return DTO object instead of entire proejct object in a list.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

UPDATE tasks_table SET  assignee_id = '${assigne_id}', task = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(task, '{resource_start_date}', '"${startdate}"'::jsonb),'{resource_end_date}', '"${enddate}"'::jsonb),'{updated_by_id}', '"${updatedby}"'::jsonb),'{assigned_by_id}', '"${assignedby}"'::jsonb), '{comments}', '"${cmt}"')WHERE  id = '${taskid}'

--- with pagination ---
UPDATE tasks_table SET  assignee_id = '${assigne_id}', task = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(task, '{resource_start_date}', '"${startdate}"'::jsonb),'{resource_end_date}', '"${enddate}"'::jsonb),'{updated_by_id}', '"${updatedby}"'::jsonb),'{assigned_by_id}', '"${assignedby}"'::jsonb), '{comments}', '"${cmt}"')WHERE  id = '${taskid}'
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)

```

# Add a new usecase to a project

Adds a new a usecase to a existing project

Method: Post

1. Start a database transaction.

2. Insert a new record into the usecases_table with project-related data.
   - Extract project_id, created_by_id, usecase_name, assigned_to_id, and description from the request.
   - Include additional usecase data like start_date, end_date, creation_date, status, and current_stage.
   - Retrieve the inserted data (usecase) with RETURNING *.

3. Fetch stages data from the projects_table based on the provided project_id.
   - Use a SELECT query to retrieve the 'stages' field from the 'project' JSONB column.

4. Prepare the stagesData for the usecases_table.
   - Create a stagesData object based on the fetched stages.
   - Map each stage to its respective assigne_id and checklists.

5. Update the usecases_table with the stagesData.
   - Use jsonb_set to update the 'stages' field in the usecase column.
   - Identify the record using its id (usecase_id).

6. Iterate through stages and tasks to insert data into the tasks_table.
   - For each stage, iterate through tasks and insert task data into tasks_table.
   - Include usecase_id, project_id, assignee_id, stage, and task details.
   - Use INSERT INTO queries within a loop.

7. Commit the database transaction.

``` SQL
--- usecases_table ---
'INSERT INTO usecases_table (project_id, usecase) VALUES ($1, $2) RETURNING *',
            [project_id, {
                name: usecase_name,
                usecase_assignee_id: assigned_to_id,
                description: description,
                created_by_id: created_by_id,
                start_date: "date",
                end_date: "date",
                creation_date: "date",
                status: "",
                current_stage: "stage_name",
            }]

--- projects_table ---
SELECT project->'workflows'->'${workflow_name}' AS workflow
          FROM projects_table
          WHERE id = $1;

--- usecases_table ---
'UPDATE usecases_table SET usecase = jsonb_set(usecase, $1, $2) WHERE id = $3', ['{stages}', stagesData, insertedData.id]
--- tasks_table ---
'INSERT INTO tasks_table (usecase_id, project_id, assignee_id, stage, task) VALUES ($1, $2, $3, $4, $5)', [taskData.usecase_id, taskData.project_id, taskData.assignee_id, taskData.stage, taskData.task]
```
# get the list view of tasks assigned to a resource 

get the list view of tasks assigned to a resource

Method : GET

-   Using the pg client create a SQL query to GET tasks assigned to a resource

```SQL

-- Queries to get the tasks assigned to a resource,projectname from project table, resourcename from resources_table 
 SELECT * FROM tasks_table WHERE assignee_id = $1,[resource_id]
 SELECT * FROM projects_table WHERE id = $1, [row.project_id]
 SELECT * FROM resources_table WHERE id = $1, [row.task.assigned_by_id]
```

# To start task after clicking start button
 
Method: PUT
 
```SQL updating tasks_table status
 
                        UPDATE tasks_table AS t
                        SET task = jsonb_set(
                            jsonb_set(t.task, '{task_assigned_date}', $1::jsonb),
                            '{status}', '"InProgress"'
                        )
                        FROM resources_table AS r
                        WHERE 
                            t.id = $2
                            AND t.assignee_id = $3
                            AND r.id = $4
    
 
```
                                                           
 
```SQL   While doing starttask the resources_table is also updating current_task field in resources
 
                        UPDATE resources_table 
                        SET resource = jsonb_set(
                            resource, '{current_task}', 
                            jsonb_build_object('task_id', $1::text, 'task_name', t.task->>'name')
                        )
                        FROM tasks_table AS t
                        WHERE 
                            t.id = $2
                            AND t.assignee_id = $3
                            AND resources_table.id = $4
```

# Get resources by role

Retrieves a list of resources based on the provided role

- Retrieve team data from the projects_table based on the project_id.

- Check if the specified team exists; return a 404 response if not.

- Check if the specified role exists in the team; return a 404 response if not.

- Retrieve resource IDs based on the specified team and role.

- Construct an SQL query to fetch resource data using the retrieved IDs.

- Add an optional filter based on the resourceName.

- Execute the SQL query to fetch resource data.

- Prepare the response with the fetched resource data.

``` SQL
--- projects_table ---
'SELECT project->\'teams\' as teams FROM projects_table WHERE id = $1', [project_id]

--- resources_table ---
let query = 'SELECT id, resource->>\'name\' as name, resource->>\'image\' as image FROM resources_table WHERE id = ANY($1)';
                const queryParams = [resourceIds];

                if (resourceName) {
                    query += ' AND resource->>\'name\' ILIKE $2';
                    queryParams.push(`%${resourceName}%`);
                }
```

# assign task
 
METHOD : PUT
 
- assigning task for a usecase.
 
 ```SQL
           UPDATE tasks_table
                            SET 
                                assignee_id = $1,
                                task = jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    task,
                                                    '{start_date}',
                                                    $2::jsonb
                                                ),
                                                '{end_date}',
                                                $3::jsonb
                                            ),
                                            '{updated_by_id}',
                                            $4::jsonb
                                        ),
                                        '{assigned_by_id}',
                                        $5::jsonb
                                    ),
                                    '{description}',
                                    $6::jsonb
                                )
                            WHERE 
                                id = $7 
 
 ```

# Add stage to project
 
METHOD : PUT
 
- adding stage to projects_table.
 
 ```SQL 
UPDATE usecases_table SET usecase = $1 WHERE id = $2', [existingData.usecase, usecase_id]); 
```


# delete project

- using await the queries will be executed one by one 

- There is a dependency(primarykey and foreignkey) on one on another table so the functions executes (tasks_table , usecases_table , projects_table).

- deleting the task by project_id from the tasks_table.

```SQL
                DELETE FROM tasks_table
                            WHERE project_id = $1


```
- deleting the usecase by project_id from the usecases_table.

```SQL
                DELETE FROM usecases_table
                            WHERE project_id = $1


```
- deleting the project by project_id from the projects_table.

```SQL

                DELETE FROM projects_table
                            WHERE id = $1


```
# delete stage from usecase

- using await the queries will be executed one by one 
- deleting the stage by usecase_id from the usecases_table.

```SQL
                UPDATE usecases_table
            SET usecase = usecase || '{"workflow": {"requirement": null}}'::jsonb
            WHERE id = $1
        `;
```
# add-resource

- adding new resource details to the database 

```SQL

          INSERT INTO resources_table (resource) VALUES ($1::jsonb)


```

# Get a list of resources (list view)

Method: GET

1. Define SQL queries to fetch data from 'resources_table', 'projects_table', and 'tasks_table'.

2. Execute the queries and store the results in resourcesResult, projectsResult, and tasksResult.

3. Extract 'project_id' from the request query parameters (event.queryStringParameters).

4. Process and transform the data:
   - Map over each resource in resourcesResult.rows.
   - For each resource, filter tasks related to that resource from tasksResult.
   - Find details of the current task for the resource.
   - Extract assigned_date and due_date from the current task details.
   - Filter and map projects related to the resource from projectsResult.
   - Include the resource in the response only if it has projects or if no project_id is provided.

5. Create the final response object:
   - Set the response statusCode to 200.
   - Set the response body to JSON.stringify(responseData).

6. If an error occurs during execution, catch the error:
   - Log the error message.
   - Create an error response with statusCode 500 and a message indicating an internal server error.

7. In the finally block, close the PostgreSQL database connection using await client.end().

8. Return the response object.

```SQL
SELECT * FROM resources_table
SELECT * FROM projects_table
SELECT * FROM tasks_table
```

# get-projects-overview

```SQL

          SELECT 
                    p.id AS project_id,
                    (p.project->>'name') AS project_name,
                    (p.project->>'status') AS status,
                    (p.project->>'end_date') AS due_date,
                    COUNT(DISTINCT u.id) AS total_usecases,
                    COUNT(DISTINCT CASE WHEN u.usecase->>'status' = 'completed' THEN u.id END) AS completed_usecases,
                    COUNT(DISTINCT t.id) AS total_tasks,
                    COUNT(t.id) FILTER (WHERE t.task->>'status' = 'completed') as tasks_completed,
                    COUNT(DISTINCT CASE WHEN t.task->>'status' = 'completed' THEN t.id END) AS completed_tasks
                  FROM projects_table AS p 
                  LEFT JOIN usecases_table AS u ON p.id = u.project_id 
                  LEFT JOIN tasks_table AS t ON u.id = t.usecase_id AND p.id = t.project_id
```