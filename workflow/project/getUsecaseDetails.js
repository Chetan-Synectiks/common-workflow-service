const { Client } = require("pg");
const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
	const usecaseId = event.queryStringParameters?.usecase_id ?? null;
	if (usecaseId == null || usecaseId === '') {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Usecase id is required",
			}),
		};
	}
	const secretsManagerClient = new SecretsManagerClient({
		region: "us-east-1",
	});
	const configuration = await secretsManagerClient.send(
		new GetSecretValueCommand({ SecretId: "serverless/lambda/credintials" })
	);
	const dbConfig = JSON.parse(configuration.SecretString);

	const client = new Client({
		host: dbConfig.host,
		port: dbConfig.port,
		database: "workflow",
		user: dbConfig.engine,
		password: dbConfig.password,
	});
	await client
		.connect()
		.then(() => {
			console.log("Connected to the database");
		})
		.catch((err) => {
			console.log("Error connecting to the database. Error :" + err);
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Internal server error : " + err.message,
				}),
			};
		});
	try {
	let query = `
                select 
                    jsonb_array_elements(u.usecase->'workflow') as stages
                from
                    usecases_table as u
                where 
                    u.id = 'ceeb4cdd-f150-4cb8-87b2-33a4df326fa0'
                `;
        // const result = await client.query(query);
        // const map = new Map();
        // const obj = result.rows.map(
        //     ({stages}) => {
        //         const stageName = Object.keys(stages)[0]
        //         const { assigne_id, description } = stages[stageName];
        //         const stageDetails = {
        //             name : stageName,
        //             assigne_id :assigne_id || '',
        //             description :description || ''
        //         }
        //         return stageDetails
        //     }
        // );

        const res1 = await client.query(`
                    select 
                        u.usecase->'workflow' as workflow
                    from
                        usecases_table as u
                    where 
                        u.id = 'ceeb4cdd-f150-4cb8-87b2-33a4df326fa0'`);
            const ob = res1.rows.map(({ workflow }) => {
                return Object.keys(workflow).map(index => {
                     const de = []
                    const stageName = Object.keys(workflow[index]).forEach(name => {
                        console.log(name)
                        const { assigne_id, description } = workflow[index][name];
                        const d = {
                            name,
                            assigne_id: assigne_id || '',
                            description: description || ''
                        };
                        de.push(d)
                    });
                    console.log(de)
                    return de
                });
            });
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(ob),
		};
	} catch (e) {
		await client.end();
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: e.message || "Internal server error",
			}),
		};
	}
};
