const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const table_name = process.env.table_name;

module.exports.handler = async (event, context) => {
  const short_url = event.queryStringParameters.short_url;

  const params = {
    TableName: table_name,
    Key: {
      id: short_url,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "URL not found" }),
      };
    }

    return {
      statusCode: 200,
      long_url: data,
      // statusCode: 302,
      // headers: {
      //   Location: long_url,
      // },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
