import {authenticated} from "./resolvers/utilities.js"
import UserResolver from "./resolvers/User.js"
import MutationResolver from "./resolvers/Mutation.js"
import QueryResolver from "./resolvers/Query.js"
import DeviceResolver from "./resolvers/Device.js"
import GraphQLToolsTypes from "graphql-tools-types"
import Sequelize from "sequelize"
import chalk from "chalk"
import bcrypt from "bcryptjs"
import jwt from "jwt-simple"
import moment from "moment"
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
    ColorValue,
} = require("../postgresql/databaseDefinition")(sequelize)

const resolvers = {
    DateTime: GraphQLToolsTypes.Date({name: "DateTime"}),
    Json: GraphQLToolsTypes.JSON({name: "Json"}),
    User: UserResolver(User, Device, Value),
    Device: DeviceResolver(
        Device,
        User,
        Value,
        FloatValue,
        StringValue,
        PlotValue,
        PlotNode,
        MapValue,
        ColorValue
    ),
    Mutation: MutationResolver(
        User,
        Device,
        Value,
        FloatValue,
        StringValue,
        JWT_SECRET
    ),
    Query: QueryResolver(Device),
    Value: {
        __resolveType(root, args, context) {
            return root.childFloat
                ? "FloatValue"
                : root.childString ? "StringValue" : null
        },
    },
}

export default resolvers
