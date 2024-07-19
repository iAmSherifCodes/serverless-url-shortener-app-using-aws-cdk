const mustache = require("mustache");
const fs = require("fs");
const shorten_url = process.env.shortenUrl;

const template = fs.readFileSync("static/index.html", "utf-8");
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const awsRegion = process.env.AWS_REGION;

module.exports.handler = async (event, context) => {
  const html = mustache.render(template, {
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    shorten_url,
  });
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
    body: html,
  };

  return response;
};
