import { PubSub } from 'graphql-subscriptions'
import GraphQLToolsTypes from 'graphql-tools-types'
import Sequelize from 'sequelize'
import UserResolver from './resolvers/User'
import MutationResolver from './resolvers/Mutation'
import QueryResolver from './resolvers/Query'
import DeviceResolver from './resolvers/Device'
import SubscriptionsResolver from './resolvers/subscriptions'

const pubsub = new PubSub()

require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const { JWT_SECRET } = process.env

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
  Notification,
} = require('../postgresql/databaseDefinition')(sequelize)

const resolvers = {
  DateTime: GraphQLToolsTypes.Date({ name: 'DateTime' }),
  Json: GraphQLToolsTypes.JSON({ name: 'Json' }),
  User: UserResolver(
    User,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    Notification,
  ),
  Device: DeviceResolver(
    Device,
    User,
    Value,
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColourValue,
    Notification,
  ),
  Mutation: MutationResolver(
    User,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    Notification,
    pubsub,
    JWT_SECRET,
  ),
  Query: QueryResolver(
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
  ),
  Subscription: SubscriptionsResolver(pubsub),
  Value: {
    __resolveType(root) {
      /* istanbul ignore else */
      if (root.__resolveType) return root.__resolveType

      /* istanbul ignore next - this should never happen */
      return root.childFloat
        ? 'FloatValue'
        : root.childString
          ? 'StringValue'
          : root.childBool ? 'BooleanValue' : 'ColourValue'
    },
  },
}

export default resolvers
