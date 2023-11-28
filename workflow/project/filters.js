exports.filters = async (event) => {
    const {Client} = require ('pg');
    const client = new Client({
        host: "localhost",
        port: "5432",
        database: "dashboard-db",
        user: "postgres",
        password: "Amar123$" 
    });
    client.connect();
    try {
    

        // Parse filter string from request body
        const filterString = event.queryStringParameters.status
        //JSON.parse(event.body);
        console.log("&&&",filterString)

        // Create SQL query for getting projects by filter
        const queryFilteredProjects = `SELECT COUNT(*) FROM projects WHERE project ->> 'status' = '${filterString}';`;
        const resultFilteredProjects = await client.query(queryFilteredProjects);

        // Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                numberOfProjects: resultFilteredProjects.rows[0].count,
                message: "Success"
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message
            })
        };
    } finally {
        await client.end();
    }
};
 