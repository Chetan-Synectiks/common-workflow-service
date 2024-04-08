const { connectToDatabase } = require("../db/dbConnector");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { z } = require("zod");

const s3Client = new S3Client({ region: "us-east-1" });

let query = `
insert into metadocs_table
(tasks_id, doc_name, doc_url, created_time, type) values ($1, $2, $3, $4, $5)
returning tasks_id, doc_name, doc_url, created_time, type`;

exports.handler = async (event) => {
  const task_id = event.pathParameters?.taskId;
  const uuidSchema = z.string().uuid();
  const isUuid = uuidSchema.safeParse(task_id);
  if (!isUuid.success) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        error: isUuid.error.issues[0].message,
      }),
    };
  }
  const body = JSON.parse(event.body);
  const fileName = body.doc_name;
  const data1 = body.data;
  const contentType = data1.split(";")[0].split(":")[1];
  const fileExtension = contentType.split("/")[1];
  const newfileName = `${fileName}.${fileExtension}`;
  const bucket = process.env.BUCKET_NAME;
  const folder = process.env.BUCKET_FOLDER_NAME;
  const buffer = Buffer.from(data1.split(",")[1], "base64");
  const s3Params = {
    Bucket: bucket,
    Key: `${folder}/${newfileName}`,
    Body: buffer,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(s3Params));
  const currentTimestamp = new Date().toISOString();
  let queryparam = [];
  const client = await connectToDatabase();
  try {
    const bucket = process.env.BUCKET_NAME
	const folder = process.env.BUCKET_FOLDER_NAME
    const link = `https://${bucket}.s3.amazonaws.com/${folder}${newfileName}`
    const type = fileExtension;
      queryparam.push(
        task_id,
        fileName,
        link,
        currentTimestamp,
        type
      );
      const result = await client.query(query, queryparam);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(result.rows[0]),
      };
  } catch (error) {
    console.error("Error inserting data:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: error.message,
        error: error,
      }),
    };
  } finally {
    await client.end();
  }
};

function isURL(str) {
  const urlRegex = /^(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+$/;
  return urlRegex.test(str);
}
