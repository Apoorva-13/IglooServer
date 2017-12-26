import request from 'supertest'
import GraphQLServer from '../app'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000 // ensures that tests don't fail due to slow connection

describe('Graphiql', () => {
  it('should work', (done) => {
    request(GraphQLServer)
      .get('/graphiql')
      .then((response) => {
        expect(response.statusCode).toBe(200)
        done()
      })
  })
})
