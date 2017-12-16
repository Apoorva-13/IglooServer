import {authenticated} from "./resolvers/utilities.js"
import UserResolver from "./resolvers/User.js"
import MutationResolver from "./resolvers/Mutation.js"
import QueryResolver from "./resolvers/Query.js"
import DeviceResolver from "./resolvers/Device.js"
import SubscriptionsResolver from "./resolvers/subscriptions.js"
import {PubSub} from "graphql-subscriptions"
import GraphQLToolsTypes from "graphql-tools-types"
import Sequelize from "sequelize"
import chalk from "chalk"
import bcrypt from "bcryptjs"
import jwt from "jwt-simple"
import moment from "moment"

let pubsub = new PubSub()
const log = console.log

require("dotenv").config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}

const {HOST, DATABASE, DB_USERNAME, PASSWORD, JWT_SECRET} = process.env

const sequelize = new Sequelize({
    host: HOST,
    port: 5432,
    database: DATABASE,
    username: DB_USERNAME,
    password: PASSWORD,
    ssl: true,
    dialect: "postgres",
    dialectOptions: {
        ssl: true,
    },
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
} = require("../postgresql/databaseDefinition")(sequelize)

const resolvers = {
    DateTime: GraphQLToolsTypes.Date({name: "DateTime"}),
    Json: GraphQLToolsTypes.JSON({name: "Json"}),
    User: UserResolver(
        User,
        Device,
        Value,
        FloatValue,
        StringValue,
        BoolValue,
        ColourValue
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
        ColourValue
    ),
    Mutation: MutationResolver(
        User,
        Device,
        Value,
        FloatValue,
        StringValue,
        BoolValue,
        ColourValue,
        pubsub,
        JWT_SECRET
    ),
    Query: QueryResolver(
        Device,
        Value,
        FloatValue,
        StringValue,
        BoolValue,
        ColourValue
    ),
    Subscription: SubscriptionsResolver(pubsub),
    Value: {
        __resolveType(root, args, context) {
            /* istanbul ignore else */
            if (root.__resolveType) return root.__resolveType

            /* istanbul ignore next - this should never happen*/
            return root.childFloat
                ? "FloatValue"
                : root.childString
                  ? "StringValue"
                  : root.childBool ? "BooleanValue" : "ColourValue"
        },
    },
}

export default resolvers
