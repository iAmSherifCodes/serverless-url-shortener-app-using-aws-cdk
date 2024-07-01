// const { init } = require('../steps/init')
const when = require('../steps/when')

describe(`When we invoke the POST /shorten endpoint`, () => {
//   beforeAll(async () => await init())

  it(`Should return short url`, async () => {
    const res = await when.we_invoke_shorten_url("www.linkedin.com/in/sherifawofiranye")

    // expect(res.statusCode).toEqual(200)
    console.log(res.body)
    // expect(res.body).toBeDefined();

  })
})