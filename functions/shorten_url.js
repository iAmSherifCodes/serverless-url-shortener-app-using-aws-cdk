const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const table_name = process.env.table_name;

const generateShortUrl = () => {
  const length = 7;
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .slice(0, length);
};

console.log(generateShortUrl());

// To handle ConditionalCheckFailedException error
// check if the generated short url does not exist in the DB

module.exports.handler = async (event, context) => {
  const { long_url } = JSON.parse(event.body);
  const short_url = generateShortUrl();

  const params = {
    TableName: table_name,
    Item: {
      short_url,
      long_url,
    },
    ConditionExpression: "attribute_not_exists(short_url)",
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error) {
    console.error("Error:", error);
  }

  try {
    await docClient.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ short_url }),
    };
  } catch (error) {
    if (error.code === "ConditionalCheckFailedException") {
      return await exports.handler(event); // Retry if short URL already exists
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
  }
};
