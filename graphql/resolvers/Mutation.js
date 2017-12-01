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
        return new Promise(async (resolve, reject) => {
            try {
                const userFound = await User.find({where: {email: args.email}})
                if (!userFound) {
                    reject("User doesn't exist. Use `SignupUser` to create one")
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
            } catch (e) {
                /* istanbul ignore next */
                log(chalk.red("INTERNAL ERROR - AuthenticateUser 103"))
                /* istanbul ignore next */
                log(e)
                /* istanbul ignore next */
                reject(
                    "103 - An internal error occured, please contact us. The error code is 103"
                )
            }
        })
    },
    // checks if a user with that email already exists
    // if not it creates one and returnes an access token
    SignupUser(root, args, context) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await User.find({where: {email: args.email}})
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
            } catch (e) /* istanbul ignore next */ {
                log(chalk.red("INTERNAL ERROR - SignupUser 102"))
                log(e)
                reject(
                    "102 - An internal error occured, please contact us. The error code is 102"
                )
            }
        })
    },
    // checks that the provided email and password are correct
    // if so changes the password and returns an access token
    ChangePassword(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const userFound = await User.find({
                        where: {id: context.auth.userId},
                    })
                    if (!userFound) {
                        reject(
                            "User doesn't exist. Use `SignupUser` to create one"
                        )
                    } else {
                        const encryptedPass = bcrypt.hashSync(
                            args.newPassword,
                            SALT_ROUNDS
                        )

                        const newUser = await userFound.update({
                            password: encryptedPass,
                        })
                        resolve({
                            id: newUser.dataValues.id,
                            token: generateAuthenticationToken(
                                newUser.dataValues.id,
                                JWT_SECRET
                            ),
                        })
                    }
                } catch (e) {
                    /* istanbul ignore next */
                    log(chalk.red("INTERNAL ERROR - ChangePassword 101"))
                    /* istanbul ignore next */
                    log(e)
                    /* istanbul ignore next */
                    reject(
                        "101 - An internal error occured, please contact us. The error code is 101"
                    )
                }
            })
        )
    },
    CreateDevice(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const newUser = await Device.create({
                        customName: args.customName,
                        deviceType: args.deviceType,
                        tags: args.tags,
                        userId: context.auth.userId,
                    })
                    const {
                        id,
                        createdAt,
                        updatedAt,
                        deviceType,
                        customName,
                        userId,
                        tags,
                    } = newUser.dataValues
                    const values = [] // values cannot be set when creating the device so no need to fetch them
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
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - CreateDevice 104"))
                    log(e)
                    reject(
                        "104 - An internal error occured, please contact us. The error code is 104"
                    )
                }
            })
        )
    },
})

export default MutationResolver
