# Workflow Management

Welcome to the documentation for the upcoming APIs that will power our workflow management system. In this document, we'll explore the pseudocode for various APIs.

## Table of Contents

-   [Get All Projects](#get-all-projects)
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
