const cheerio = require('cheerio')

describe(`When we invoke the GET / endpoint`, () => {
  it(`Should return the index page with contentType text/html`, async () => {
    const res = await when.we_invoke_get_index()

    expect(res.statusCode).toEqual(200)
    expect(res.headers['Content-Type']).toEqual('text/html; charset=UTF-8')

  })
})