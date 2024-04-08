const { uploadToS3 } = require("./uploadDocs")

exports.handler = async (event) => {
    const { doc_name, data } = JSON.parse(event.body);
    const upload = await uploadToS3(doc_name, data)
    const url = upload.link
    const type = upload.fileExtension
    const statusCode = upload.statusCode
    const currentTimestamp = new Date().toISOString();
    
    if (statusCode === 200) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                url
            }),
        };
    } else {
        return {
            statusCode: statusCode,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                error: "Upload failed",
            }),
        };
    }
};
