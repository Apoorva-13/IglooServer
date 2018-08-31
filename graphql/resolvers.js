import GraphQLToolsTypes from 'graphql-tools-types'
import UserResolver from './resolvers/User'
import BoardResolver from './resolvers/Board'
import MutationResolver from './resolvers/Mutation'
import QueryResolver from './resolvers/Query'
import DeviceResolver from './resolvers/Device'
import SubscriptionsResolver from './resolvers/subscriptions'
import NotificationResolver from './resolvers/Notification'
import ValueResolver from './resolvers/Value'
import ValueResolvers from './resolvers/Values'
import SequelizeConnections from '../postgresql/databaseConnection'
import { pubsub } from '../shared'

require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const { JWT_SECRET } = process.env

const {
  User,
  Board,
  PermanentToken,
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
  WebPushSubscription,
  StringPlotNode,
  StringPlotValue,
} = SequelizeConnections

const resolvers = {
  DateTime: GraphQLToolsTypes.Date({ name: 'DateTime' }),
  Json: GraphQLToolsTypes.JSON({ name: 'Json' }),
  User: UserResolver(SequelizeConnections),
  Board: BoardResolver(SequelizeConnections),
  Device: DeviceResolver(SequelizeConnections),
  Mutation: MutationResolver(
    User,
    PermanentToken,
    Device,
    Board,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    MapValue,
    PlotValue,
    PlotNode,
    StringPlotValue,
    StringPlotNode,
    Notification,
    WebPushSubscription,
    pubsub,
    JWT_SECRET,
  ),
  Query: QueryResolver(
    User,
    Device,
    Board,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    PlotValue,
    StringPlotValue,
    MapValue,
    Notification,
  ),
  Subscription: SubscriptionsResolver(pubsub, Device, Board),
  Value: ValueResolver(
    {
      BoolValue,
      FloatValue,
      StringValue,
      PlotValue,
      StringPlotValue,
      MapValue,
      ColourValue,
    },
    Device,
    Board,
  ),
  ...ValueResolvers(
    {
      BoolValue,
      FloatValue,
      StringValue,
      ColourValue,
      PlotValue,
      PlotNode,
      StringPlotValue,
      StringPlotNode,
    },
    Device,
    Board,
  ),
  Notification: NotificationResolver(SequelizeConnections),
}

export default resolvers
