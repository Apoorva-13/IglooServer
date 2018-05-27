const supertest = require('supertest')
const fs = require('fs')
require('../server')
const request = require('request-promise-native')

const GRAPHQL_PORT = process.env.PORT || 3000
jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000

const server = supertest('http://localhost:3000')

describe('images', () => {
  let imageId
  let token

  beforeAll(async () => {
    const res = await server
      .post('/graphql')
      .set('content-type', 'application/json')
      .set('accept', 'application/json')
      .send({
        query: `mutation SignupUser($email: String!, $password: String!) {
                                SignupUser(email: $email, password: $password) {
                                    id
                                    token
                                }
                            }
                        `,
        variables: {
          email: 'imageTest@email.com',
          password: 'password',
        },
      })

    const parsedRes = JSON.parse(res.text)
    token = parsedRes.data.SignupUser.token
  })

  it('should be able to upload images', async (done) => {
    const formData = {
      custom_file: {
        value: fs.createReadStream('./tests/test.png'),
        options: {
          filename: 'image.jpg',
        },
      },
    }

    const res = await request.post({
      url: 'http://localhost:3000/fileupload',
      formData,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    // we don't need expects, because the promise throws if it fails
    imageId = res

    done()
  })

  it('should not be able to upload images without a token', async (done) => {
    const formData = {
      custom_file: {
        value: fs.createReadStream('./tests/test.png'),
        options: {
          filename: 'image.jpg',
        },
      },
    }

    const res = request
      .post({
        url: 'http://localhost:3000/fileupload',
        formData,
      })
      .then((res) => {
        throw new Error(`Server uploaded file without checking token and returned: ${res}`)
      })
      .catch((e) => {
        expect(e.message).toBe('401 - "Missing valid authentication token"')
        done()
      })
  })
})
