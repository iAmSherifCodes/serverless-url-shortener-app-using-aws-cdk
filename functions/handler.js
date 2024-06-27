const mustache = require("mustache");
const fs = require("fs");
const shorten_url = process.env.shortenUrl;

const template = fs.readFileSync("static/index.html", "utf-8");
module.exports.hello = async (event, context) => {
  const html = mustache.render(template, {
    shorten_url,
  });
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hi Dear!'
  })
  };

  return response;
};
