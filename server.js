import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import jwt from 'jwt-simple'
import { createServer } from 'http'
import schema from './graphql/schema'
import graphQLServer from './app'
import { logger } from './graphql/resolvers/utilities'

require('dotenv').config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const GRAPHQL_PORT = process.env.PORT || 3000

const httpServer = createServer(graphQLServer)
httpServer.listen(GRAPHQL_PORT, () => {
  logger.info(
    `GraphiQL is now running on http://localhost:${GRAPHQL_PORT}/graphiql`,
    { label: 'httpServer' },
  )

  new SubscriptionServer( // eslint-disable-line no-new
    {
      execute,
      subscribe,
      schema,
      onConnect: (connectionParams) => {
        if (!connectionParams.Authorization) {
          return false
        } else if (!connectionParams.Authorization.startsWith('Bearer ')) {
          return false
        }
        try {
          const decodedJwt = jwt.decode(
            connectionParams.Authorization.substring(7),
            process.env.JWT_SECRET,
          )
          return { auth: decodedJwt }
        } catch (e) /* istanbul ignore next */ {
          logger.error(e, { label: 'subscriptionServer', code: 119 })
          return false
        }
      },
    },
    {
      server: httpServer,
      path: '/subscriptions',
    },
  )
})

module.exports = httpServer
