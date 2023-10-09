
# Workflow Pseudocode
 
## 1.Project API

### 1.1 Function to add a new project

- Method: POST
- API End Point: `/api/addProject`
- Request: `req.body`
- Response: `res.status(201).json({ data: newProject })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `addProject`.
        - This `addProject` method accepts `(req, res)`
        - It returns the object in the response.

### 1.2 Function to update an existing project based on id.

- Method: PUT
- API End Point: `/api/updateProject/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: newProject })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateProject`.
        - This `updateProject` method accepts `(req, res)`
        - It returns the object in the response.

### 1.3 Function to delete a project based on id.

- Method: DELETE
- API End Point: `/api/deleteProject/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Project deleted successfully' })

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteProject`.
        - This `deleteProject` method accepts `(req, res)`
        - It returns the success message in the response.

### 1.4 Function to get list of all projects 

- Method: GET
- API End Point: `/api/getProject`
- Request: async `(req, res)`
- Response: `res.status(200).json(project)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getAllProjects`.
        - This `getAllProjects` method accepts `(req, res)`
        - It returns the list of projects in the response.

### 1.5 Function to add a project.

- Method: POST
- API End Point: `/api/createProject`
- Request: async `(req, res)`
- Response: `res.status(201).json(newProject)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `createProject`.
        - This `createProject` method accepts `(req, res)` or `(projectData)`
        - It returns the object in the response.

## 2.Use Case API

### 2.1 Function to add a Usecase

- Method: POST
- API End Point: `/api/usecase`
- Request: `req.body`
- Response: `res.status(201).json({ data: newUseCase })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `createUsecase`.
        - This `createUsecase` method accepts `(req, res)` or `(usecaseData)`
        - It returns the object in the response.

### 2.2 Function to update an existing Usecase based on id.

- Method: PUT
- API End Point: `/api/usecase/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: updatedUseCase })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateUsecase`.
        - This `updateUsecase` method accepts `(req, res)` or `(UsecaseData)`
        - It returns the object in the response.

### 2.3 Function to delete an existing Usecase based on id.

- Method: DELETE
- API End Point: `/api/usecase/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Use case deleted successfully' })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteUsecase`.
        - This `deleteUsecase` method accepts `(req, res)` or `(UsecaseData)`
        - It returns the success message in the response.

### 2.4 Function to list stages in particular Usecase

- Method: GET
- API End Point: `/api/usecase/:usecaseId/stages`
- Request: async `(req, res)`
- Response: `res.status(200).json(useCases)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getUsecase`.
        - This `getUsecase` method accepts `(req, res)` or `(UsecaseData)`
        - It returns the list of use cases in the response.

### 2.5 Function to get an existing Usecase basedon id.

- Method: GET
- API End Point: `/api/usecase/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(useCases)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getUsecase`.
        - This `getUsecase` method accepts `(req, res)` or `(UsecaseData)`
        - It returns the object in the response.

## 3.Project Team API

### 3.1 Function to add Projectteam

- Method: POST
- API End Point: `/api/project-team`
- Request: `req.body`
- Response: `res.status(201).json({ data: newProjectteam })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `createProjectteam`.
        - This `createProjectteam` method accepts `(req, res)` or `(ProjectteamData)`
        - It returns the object in the response.

### 3.2 Function to update an existing Projectteam based on id

- Method: PUT
- API End Point: `/api/project-team/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: updatedProjectteam })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateProjectteam`.
        - This `updateProjectteam` method accepts `(req, res)` or `(ProjectteamData)`
        - It returns the object in the response.

### 3.3 Function to delete an existing Projectteam based on id.

- Method: DELETE
- API End Point: `/api/project-team/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Projectteam deleted successfully' })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteProjectteam`.
        - This `deleteProjectteam` method accepts `(req, res)` or `(ProjectteamData)`
        - It returns the success message in the response.

### 3.4 Function to get complete Projectteam

- Method: GET
- API End Point: `/api/project-team`
- Request: async `(req, res)`
- Response: `res.status(200).json(Projectteams)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getProjectteam`.
        - This `getProjectteam` method accepts `(req, res)` or `(ProjectteamData)`
        - It returns the list of project teams in the response.

### 3.5 Function to get an existing Projectteam

- Method: GET
- API End Point: `/api/project-team/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(Projectteams)`

   1. Routes forward request to controller
   2. Controller calls models
   3. There is a method defined in the controller - `getProjectteam`.
        - This `getProjectteam` method accepts `(req, res)` or `(ProjectteamData)`
        - It returns the object in the response.

## 4.Resource API

### 4.1 Function to add a Resource

- Method: POST
- API End Point: `/api/resource`
- Request: `req.body`
- Response: `res.status(201).json({ data: newResource })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `createResource`.
        - This `createResource` method accepts `(req, res)` or `(ResourceData)`
        - It returns the object in the response.

### 4.2 Function to update an existing Resource based on id

- Method: PUT
- API End Point: `/api/resource/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: updatedResource })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateResource`.
        - This `updateResource` method accepts `(req, res)` or `(ResourceData)`
        - It returns the object in the response.

### 4.3 Function to delete an existing Resource based on id.

- Method: DELETE
- API End Point: `/api/Resource/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Use case deleted successfully' })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteResource`.
        - This `deleteResource` method accepts `(req, res)` or `(ResourceData)`
        - It returns the success message in the response.

### 4.4 Function to get an list of Resources

- Method: GET
- API End Point: `/api/resource`
- Request: async `(req, res)`
- Response: `res.status(200).json(Resources)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getResource`.
        - This `getResource` method accepts `(req, res)` or `(ResourceData)`
        - It returns the list of resources in the response.

### 4.5 Function to get an existing Resource based on id

- Method: GET
- API End Point: `/api/resource/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(Resources)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getResource`.
        - This `getResource` method accepts `(req, res)` or `(ResourceData)`
        - It returns the object in the response.

## 5.Substage API

### 5.1 Function to add a Substage

- Method: POST
- API End Point: `/api/substage`
- Request: `req.body`
- Response: `res.status(201).json({ data: newSubstage })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `createSubstage`.
        - This `createSubstage` method accepts `(req, res)` or `(SubstageData)`
        - It returns the object in the response.

### 5.2 Function to Update an existing Substage based on id

- Method: PUT
- API End Point: `/api/substage/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: updatedSubstage })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateSubstage`.
        - This `updateSubstage` method accepts `(req, res)` or `(SubstageData)`
        - It returns the object in the response.

### 5.3 Function to delete an existing Substage based on id

- Method: DELETE
- API End Point: `/api/Substage/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Use case deleted successfully' })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteSubstage`.
        - This `deleteSubstage` method accepts `(req, res)` or `(SubstageData)`
        - It returns the success message in the response.

### 5.4 Function to get an existing Substage based on id

- Method: GET
- API End Point: `/api/substage/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(Substages)`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getSubstage`.
        - This `getSubstage` method accepts `(req, res)` or `(SubstageData)`
        - It returns the object in the response.

## 6.Task Management API

### 6.1 Add a New Task

- Method: POST
- API End Point: `/api/task`
- Request: `req.body`
- Response: `res.status(201).json({ data: newTask })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `addTask`.
        - This `addTask` method accepts `(req, res)`
        - It returns the object in the response.

### 6.2 Get All Task Lists

- Method: GET
- API End Point: `/api/task`
- Request: async `(req, res)`
- Response: `res.status(200).json(taskList);`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getTaskList`.
        - This `getTaskList` method accepts `(req, res)`
        - It returns `res.status(200).json(taskList);` in the response.

### 6.3 Get a Task by ID

- Method: GET
- API End Point: `/api/task/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(taskId);`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getTask`.
        - This `getTask` method accepts `(req, res)`
        - It returns `res.status(200).json(taskId);` in the response.

### 6.4 Update an Existing Task based on id

- Method: PUT
- API End Point: `/api/task/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: newTask })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateTask`.
        - This `updateTask` method accepts `(req, res)`
        - It returns the object in the response.

### 6.5 Delete a Task by id

- Method: DELETE
- API End Point: `/api/task/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Task deleted successfully' });`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteTask`.
        - This `deleteTask` method accepts `(req, res)`
        - It returns `res.status(200).json({ message: 'Task deleted successfully' })` in the response.

## 7.Stage Management API

### 7.1Add a New Stage

- Method: POST
- API End Point: `/api/stage`
- Request: `req.body`
- Response: `res.status(201).json({ data: newStage })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `addStage`.
        - This `addStage` method accepts `(req, res)`
        - It returns the object in the response.

### 7.2 Get a Stage by ID

- Method: GET
- API End Point: `/api/stage/:id`
- Request: async `(req, res)`
- Response: `res.status(200).json(stageId);`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `getStage`.
        - This `getStage` method accepts `(req, res)`
        - It returns `res.status(200).json(stageId);` in the response.

### 7.3 Update an Existing Stage based on id

- Method: PUT
- API End Point: `/api/stage/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ data: newStage })`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `updateStage`.
        - This `updateStage` method accepts `(req, res)`
        - It returns the object in the response.

### 7.4 Delete a Stage by id

- Method: DELETE
- API End Point: `/api/stage/:id`
- Request: `req.params.id`
- Response: `res.status(200).json({ message: 'Stage deleted successfully' });`

    1. Routes forward request to controller
    2. Controller calls models
    3. There is a method defined in the controller - `deleteStage`.
        - This `deleteStage` method accepts `(req, res)`
        - It returns `res.status(200).json({ message: 'Stage deleted successfully' })` in the response.
