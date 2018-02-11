require('dotenv').config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}
import express from 'express'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import bodyParser from 'body-parser'
import schema from './graphql/schema'
import expressJwt from 'express-jwt'
import cors from 'cors'
import Sequelize from 'sequelize'
import createLoaders from './graphql/loaders'

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  ssl: true,
  dialect: 'postgres',
  dialectOptions: {
    ssl: true,
  },
  logging: false,
})

const {
  User,
  Device,
  Value,
  BoolValue,
  FloatValue,
  StringValue,
  PlotValue,
  PlotNode,
  MapValue,
  ColourValue,
} = require('./postgresql/databaseDefinition')(sequelize)

const GRAPHQL_PORT = process.env.PORT || 3000
/* istanbul ignore next */
const WEBSOCKET_URL =
  process.env.NODE_ENV === 'production'
    ? 'wss://iglooql.herokuapp.com/subscriptions'
    : `ws://localhost:${GRAPHQL_PORT}/subscriptions`
const graphQLServer = express()

graphQLServer.use(cors())
graphQLServer.use(
  '/graphql',
  bodyParser.json(),
  expressJwt({ secret: process.env.JWT_SECRET, credentialsRequired: false }),
  graphqlExpress(req => ({
    schema,
    context: {
      auth: req.user,
      loaders: createLoaders({
        User,
        Device,
        Value,
        BoolValue,
        FloatValue,
        StringValue,
        PlotValue,
        PlotNode,
        MapValue,
        ColourValue,
      }),
    },
  })),
)
/* istanbul ignore next */
graphQLServer.get('/graphiql', (req, res, next) => {
  if (req.query.bearer) {
    return graphiqlExpress({
      endpointURL: '/graphql',
      subscriptionsEndpoint: WEBSOCKET_URL,
      passHeader: `'Authorization': 'Bearer ${req.query.bearer}'`,
      websocketConnectionParams: {
        Authorization: `Bearer ${req.query.bearer}`,
      },
    })(req, res, next)
  }
  return graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: WEBSOCKET_URL,
  })(req, res, next)
})

export default graphQLServer
