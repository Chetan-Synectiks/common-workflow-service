# Get All Projects

Retrieves the list of all the Projects without filtering.

Method : GET

- Using the pg client create a SQL query for a SELECT statment to get all rows in the Projects table

- Query the database to get all projects and their corresponding use cases that fall within the specified date range.

- Count the number of completed and incomplete use cases for each project.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---

SELECT * FROM Projects;

--- with pagination ---

SELECT * FROM Projects
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)
```

# Get a Projects

Retrieves the list of a Projects with filtering.

Method : GET

- Using the pg client create a SQL query using a WHERE clause to get a rows in the Projects table

- Query the database to get a projects and their corresponding use cases that fall within the specified date range.

- Return the results as a JSON response.

> This Api may or may not need pagation support

```SQL
--- without pagination ---
    SELECT *
    FROM Projects
    WHERE Project_id = $1

--- with pagination ---

SELECT * FROM Projects
  WHERE Project_id = $1
  ORDER BY id
  LIMIT 10
  OFFSET page_key; (provided in the request)
```