import { PubSub } from 'graphql-subscriptions'
import GraphQLToolsTypes from 'graphql-tools-types'
import UserResolver from './resolvers/User'
import MutationResolver from './resolvers/Mutation'
import QueryResolver from './resolvers/Query'
import DeviceResolver from './resolvers/Device'
import SubscriptionsResolver from './resolvers/subscriptions'
import NotificationResolver from './resolvers/Notification'
import ValueResolver from './resolvers/Value'
import ValueResolvers from './resolvers/Values'
import {
  User,
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
} from '../postgresql/databaseConnection'

const pubsub = new PubSub()

require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const { JWT_SECRET } = process.env

const resolvers = {
  DateTime: GraphQLToolsTypes.Date({ name: 'DateTime' }),
  Json: GraphQLToolsTypes.JSON({ name: 'Json' }),
  User: UserResolver(
    User,
    PermanentToken,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    PlotValue,
    MapValue,
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
    PermanentToken,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    MapValue,
    PlotValue,
    PlotNode,
    Notification,
    WebPushSubscription,
    pubsub,
    JWT_SECRET,
  ),
  Query: QueryResolver(
    User,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
  ),
  Subscription: SubscriptionsResolver(pubsub, Device),
  Value: ValueResolver({
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColourValue,
  }),
  ...ValueResolvers({
    BoolValue,
    FloatValue,
    StringValue,
    ColourValue,
    PlotValue,
    PlotNode,
  }),
  Notification: NotificationResolver(Notification, User, Device),
}

export default resolvers
