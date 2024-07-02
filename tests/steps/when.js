const APP_ROOT = "../../";
const _ = require("lodash");

const viaHandler = async (event, functionName) => {
  const handler = require(`${APP_ROOT}/functions/${functionName}`).handler;

  const context = {};
  const response = await handler(event, context);
  const contentType = _.get(
    response,
    "headers.Content-Type",
    "application/json"
  );
  if (response.body && contentType === "application/json") {
    response.body = JSON.parse(response.body);
  }
  return response;
};

const we_invoke_handler = () => viaHandler({}, "handler");
const we_invoke_shorten_url = (long_url) => {
  let event = {
    body: JSON.stringify({ long_url }),
  };

  return viaHandler(event, "shorten_url");
};
const we_invoke_redirect = (short_url) => {
  let event = {
    queryStringParameters: { short_url },
  };

  return viaHandler(event, "redirect");
};

module.exports = {
  we_invoke_handler,
  we_invoke_shorten_url,
  we_invoke_redirect,
};
