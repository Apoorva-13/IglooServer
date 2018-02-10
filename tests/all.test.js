import request from 'supertest'
import GraphQLServer from '../app'
import DeviceTests from './Device'
import MutationTests from './Mutation'
import NotificationsTest from './Notifications'
import UserTests from './User'
import ValueTests from './Value'

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

DeviceTests(GraphQLServer)
MutationTests(GraphQLServer)
NotificationsTest(GraphQLServer)
UserTests(GraphQLServer)
ValueTests(GraphQLServer)
