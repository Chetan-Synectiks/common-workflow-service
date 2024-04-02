exports.optionalParamsValidator = schema => ({
	before: (handler) => {
		const { queryStringParameters } = handler.event

		const result = schema.safeParse(queryStringParameters)
		if (!result.success) {
			throw new Error("Invalid query parameters")
		}
	},
})
