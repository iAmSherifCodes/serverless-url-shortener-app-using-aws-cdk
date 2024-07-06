const cheerio = require("cheerio");
const when =  require('../steps/when')

describe(`When we invoke the GET / endpoint`, () => {
  it(`Should return the index page with contentType text/html`, async () => {
    const res = await when.we_invoke_handler();

    expect(res.statusCode).toEqual(200);
    expect(res.headers["Content-Type"]).toEqual("text/html; charset=UTF-8");
    expect(res.body).toBeDefined()

    const _ = cheerio.load(res.body);
    expect(_).toBeDefined()
  });
});
