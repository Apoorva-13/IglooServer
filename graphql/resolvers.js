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
const SALT_ROUNDS = 10
const JWT_EXPIRE_DAYS = 7

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

const authenticated = (context, callback) =>
    context.auth
        ? callback
        : (resolve, reject) =>
              reject(
                  "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
              )

const resolvers = {
    DateTime: GraphQLToolsTypes.Date({name: "DateTime"}),
    Json: GraphQLToolsTypes.JSON({name: "Json"}),
    User: {
        id(root, args, context) {
            return new Promise(
                authenticated(context, (resolve, reject) => {
                    if (context.auth.id !== root.id) {
                        reject(
                            "You are not allowed to access details about this user"
                        )
                    } else {
                        User.find({where: {id: args.id}})
                            .then(userFound => {
                                if (!userFound) {
                                    reject(
                                        "User doesn't exist. Use `SignupUser` to create one"
                                    )
                                } else {
                                    const {
                                        id,
                                        createdAt,
                                        updatedAt,
                                        email,
                                    } = userFound
                                    resolve({
                                        id,
                                        createdAt,
                                        updatedAt,
                                        email,
                                    })
                                }
                            })
                            .catch(e => {
                                log(chalk.red("INTERNAL ERROR - User 105"))
                                log(e)
                                reject(
                                    "105 - An internal error occured, please contact us. The error code is 105"
                                )
                            })
                    }
                })
            )
        },
    },
    Mutation: {
        // checks if the user exists, if so
        // compares the given password with the hash
        // and returns an access token
        AuthenticateUser(root, args, context) {
            return new Promise((resolve, reject) => {
                User.find({where: {email: args.email}})
                    .then(userFound => {
                        if (!userFound) {
                            reject(
                                "User doesn't exist. Use `SignupUser` to create one"
                            )
                        } else if (
                            bcrypt.compareSync(
                                args.password,
                                userFound.dataValues.password
                            )
                        ) {
                            resolve({
                                id: userFound.dataValues.id,
                                token: jwt.encode(
                                    {
                                        exp: moment()
                                            .utc()
                                            .add({days: JWT_EXPIRE_DAYS})
                                            .unix(),
                                        userId: userFound.dataValues.id,
                                    },
                                    JWT_SECRET
                                ),
                            })
                        } else {
                            reject("Wrong password")
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - AuthenticateUser 103"))
                        log(e)
                        reject(
                            "103 - An internal error occured, please contact us. The error code is 103"
                        )
                    })
            })
        },
        // checks if a user with that email already exists
        // if not it creates one and returnes an access token
        SignupUser(root, args, context) {
            return new Promise((resolve, reject) => {
                User.find({where: {email: args.email}})
                    .then(user => {
                        if (user) {
                            reject("A user with this email already exists")
                        } else {
                            const encryptedPass = bcrypt.hashSync(
                                args.password,
                                SALT_ROUNDS
                            )

                            User.create({
                                email: args.email,
                                password: encryptedPass,
                            }).then(newUser => {
                                resolve({
                                    id: newUser.dataValues.id,
                                    token: jwt.encode(
                                        {
                                            exp: moment()
                                                .utc()
                                                .add({days: JWT_EXPIRE_DAYS})
                                                .unix(),
                                            userId: newUser.dataValues.id,
                                        },
                                        JWT_SECRET
                                    ),
                                })
                            })
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - SignupUser 102"))
                        log(e)
                        reject(
                            "102 - An internal error occured, please contact us. The error code is 102"
                        )
                    })
            })
        },
        // checks that the provided email and password are correct
        // if so changes the password and returns an access token
        ChangePassword(root, args, context) {
            return new Promise(
                authenticated(context, (resolve, reject) => {
                    User.find({where: {id: context.auth.userId}})
                        .then(userFound => {
                            if (!userFound) {
                                reject(
                                    "User doesn't exist. Use `SignupUser` to create one"
                                )
                            } else {
                                const encryptedPass = bcrypt.hashSync(
                                    args.newPassword,
                                    SALT_ROUNDS
                                )

                                userFound
                                    .update({
                                        password: encryptedPass,
                                    })
                                    .then(newUser => {
                                        resolve({
                                            id: newUser.dataValues.id,
                                            token: jwt.encode(
                                                {
                                                    exp: moment()
                                                        .utc()
                                                        .add({
                                                            days: JWT_EXPIRE_DAYS,
                                                        })
                                                        .unix(),
                                                    userId:
                                                        newUser.dataValues.id,
                                                },
                                                JWT_SECRET
                                            ),
                                        })
                                    })
                            }
                        })
                        .catch(e => {
                            log(
                                chalk.red("INTERNAL ERROR - ChangePassword 101")
                            )
                            log(e)
                            reject(
                                "101 - An internal error occured, please contact us. The error code is 101"
                            )
                        })
                })
            )
        },
        CreateDevice(root, args, context) {
            return new Promise(
                authenticated(context, (resolve, reject) => {
                    const {customName, deviceType, valueIds, tags} = args
                    Device.create({
                        customName,
                        deviceType,
                        valueIds,
                        tags,
                        userId: context.auth.userId,
                    })
                        .then(newUser => {
                            const {
                                id,
                                createdAt,
                                updatedAt,
                                deviceType,
                                customName,
                            } = newUser.dataValues
                            const tags = newUser.dataValues.tags
                                ? newUser.dataValues.tags
                                : []
                            const values = []
                            resolve({
                                id,
                                createdAt,
                                updatedAt,
                                deviceType,
                                customName,
                                tags,
                                values,
                                user: {
                                    id: context.auth.userId,
                                },
                            })
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - CreateDevice 104"))
                            log(e)
                            reject(
                                "104 - An internal error occured, please contact us. The error code is 104"
                            )
                        })
                })
            )
        },
    },
}

export default resolvers
