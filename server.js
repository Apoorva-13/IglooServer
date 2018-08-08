import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import jwt from 'jwt-simple'
import { createServer } from 'http'
import schema from './graphql/schema'
import graphQLServer from './app'
import { logger } from './graphql/resolvers/utilities'
import { socketToDeviceMap } from './graphql/resolvers/utilities'
import { Device } from './postgresql/databaseConnection'
import { pubsub } from './shared'

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
      onConnect: (connectionParams, websocket) => {
        if (!connectionParams.Authorization) {
          return false
        } else if (!connectionParams.Authorization.startsWith('Bearer ')) {
          return false
        }
        try {
          // FIXME: does this check that the token was not forged?
          const decodedJwt = jwt.decode(
            connectionParams.Authorization.substring(7),
            process.env.JWT_SECRET,
          )
          return { auth: decodedJwt, websocket }
        } catch (e) /* istanbul ignore next */ {
          logger.error(e, { label: 'subscriptionServer', code: 119 })
          return false
        }
      },
      onOperationComplete: async (websocket) => {
        if (socketToDeviceMap.hasOwnProperty(websocket)) {
          const { deviceId, userId } = socketToDeviceMap[websocket]
          await Device.update(
            { online: false, lastSeen: +new Date() },
            { where: { id: deviceId } },
          )

          pubsub.publish('deviceUpdated', {
            deviceUpdated: { id: deviceId },
            userId,
          })
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
