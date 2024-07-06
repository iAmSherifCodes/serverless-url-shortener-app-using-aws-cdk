const { init } = require("../steps/init");
const when = require("../steps/when");

describe(`When we invoke the GET /redirect endpoint`, () => {
  beforeAll(async () => await init());

  it(`Should have header location`, async () => {
    const res = await when.we_invoke_shorten_url(
      "www.linkedin.com/in/sherifawofiranye"
    );
    console.log(res.body.url);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("url");

    const redirectRes = await when.we_invoke_redirect(res.body.url);
    console.log(redirectRes.body);

    expect(redirectRes.statusCode).toEqual(302);
    // expect(res.body).toHaveProperty("url");
  });
});
