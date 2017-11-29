import {authenticated} from "./resolvers/utilities.js"
import UserResolver from "./resolvers/User.js"
import MutationResolver from "./resolvers/Mutation.js"
import GraphQLToolsTypes from "graphql-tools-types"
import Sequelize from "sequelize"
import chalk from "chalk"
import bcrypt from "bcryptjs"
import jwt from "jwt-simple"
import moment from "moment"
const log = console.log

require("dotenv").config()
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
    Mutation: MutationResolver(User, Device, JWT_SECRET),
}

export default resolvers
