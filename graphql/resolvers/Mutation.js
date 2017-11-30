import {authenticated, generateAuthenticationToken} from "./utilities.js"
import bcrypt from "bcryptjs"
import jwt from "jwt-simple"
import moment from "moment"
import chalk from "chalk"
const log = console.log

const SALT_ROUNDS = 10

const MutationResolver = (User, Device, JWT_SECRET) => ({
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
                            token: generateAuthenticationToken(
                                userFound.dataValues.id,
                                JWT_SECRET
                            ),
                        })
                    } else {
                        reject("Wrong password")
                    }
                })
                .catch(e => {
                    /* istanbul ignore next */
                    log(chalk.red("INTERNAL ERROR - AuthenticateUser 103"))
                    /* istanbul ignore next */
                    log(e)
                    /* istanbul ignore next */
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
                                token: generateAuthenticationToken(
                                    newUser.dataValues.id,
                                    JWT_SECRET
                                ),
                            })
                        })
                    }
                })
                .catch(e => {
                    /* istanbul ignore next */
                    log(chalk.red("INTERNAL ERROR - SignupUser 102"))
                    /* istanbul ignore next */
                    log(e)
                    /* istanbul ignore next */
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
                                        token: generateAuthenticationToken(
                                            newUser.dataValues.id,
                                            JWT_SECRET
                                        ),
                                    })
                                })
                        }
                    })
                    .catch(e => {
                        /* istanbul ignore next */
                        log(chalk.red("INTERNAL ERROR - ChangePassword 101"))
                        /* istanbul ignore next */
                        log(e)
                        /* istanbul ignore next */
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
                            userId,
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
                                id: userId,
                            },
                        })
                    })
                    .catch(e => {
                        /* istanbul ignore next */
                        log(chalk.red("INTERNAL ERROR - CreateDevice 104"))
                        /* istanbul ignore next */
                        log(e)
                        /* istanbul ignore next */
                        reject(
                            "104 - An internal error occured, please contact us. The error code is 104"
                        )
                    })
            })
        )
    },
})

export default MutationResolver
