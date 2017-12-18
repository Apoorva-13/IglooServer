"use strict"

import {
    authenticated,
    generateAuthenticationToken,
    CreateGenericValue,
    getPropsIfDefined,
    genericValueMutation,
    create2FSecret,
    check2FCode,
} from "./utilities.js"
import bcrypt from "bcryptjs"
import jwt from "jwt-simple"
import moment from "moment"
import chalk from "chalk"
import OTP from "otp.js"
const log = console.log
const SALT_ROUNDS = 10

const MutationResolver = (
    User,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    pubsub,
    JWT_SECRET
) => ({
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
                    !bcrypt.compareSync(
                        args.password,
                        userFound.dataValues.password
                    )
                ) {
                    reject("Wrong password")
                } else if (!userFound.twoFactorSecret) {
                    resolve({
                        id: userFound.dataValues.id,
                        token: generateAuthenticationToken(
                            userFound.dataValues.id,
                            JWT_SECRET
                        ),
                    })
                } else if (
                    check2FCode(args.twoFactorCode, userFound.twoFactorSecret)
                ) {
                    resolve({
                        id: userFound.dataValues.id,
                        token: generateAuthenticationToken(
                            userFound.dataValues.id,
                            JWT_SECRET
                        ),
                    })
                } else {
                    reject("Wrong or missing 2-Factor Authentication Code")
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
    UpgradeTo2FactorAuthentication(root, args, context) {
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
                    } else if (!userFound.twoFactorSecret) {
                        const {secret, qrCode} = create2FSecret(userFound.email)
                        await userFound.update({twoFactorSecret: secret})
                        resolve({secret, qrCode})
                    } else {
                        const qrCode = OTP.googleAuthenticator.qrCode(
                            userFound.email,
                            "igloo",
                            userFound.twoFactorSecret
                        )

                        resolve({
                            secret: userFound.twoFactorSecret,
                            qrCode,
                        })
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(
                        chalk.red(
                            "INTERNAL ERROR - UpgradeTo2FactorAuthentication 118"
                        )
                    )
                    log(e)
                    reject(
                        "118 - An internal error occured, please contact us. The error code is 118"
                    )
                }
            })
        )
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
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - ChangePassword 101"))
                    log(e)
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
                    const newDevice = await Device.create({
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
                    } = newDevice.dataValues
                    const values = [] // values cannot be set when creating the device so no need to fetch them

                    const resolveValue = {
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
                    }

                    pubsub.publish("deviceCreated", {
                        deviceCreated: resolveValue,
                        userId: context.auth.userId,
                    })

                    resolve(resolveValue)
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
    CreateFloatValue: CreateGenericValue(
        Device,
        Value,
        ["precision", "boundaries"],
        "childFloat",
        FloatValue,
        pubsub
    ),
    CreateStringValue: CreateGenericValue(
        Device,
        Value,
        ["maxChars"],
        "childString",
        StringValue,
        pubsub
    ),
    CreateBooleanValue: CreateGenericValue(
        Device,
        Value,
        [],
        "childBool",
        BoolValue,
        pubsub
    ),
    CreateColourValue: CreateGenericValue(
        Device,
        Value,
        [],
        "childColour",
        ColourValue,
        pubsub
    ),
    user(root, args, context) {
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
                        const newUser = await userFound.update({
                            email: args.email,
                        })
                        resolve(newUser)
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - user mutation 115"))
                    log(e)
                    reject(
                        "115 - An internal error occured, please contact us. The error code is 115"
                    )
                }
            })
        )
    },
    device(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const deviceFound = await Device.find({
                        where: {id: args.id},
                    })
                    if (!deviceFound) {
                        reject(
                            "Device doesn't exist. Use `CreateDevice` to create one"
                        )
                    } else if (deviceFound.userId !== context.auth.userId) {
                        reject(
                            "You are not allowed to access details about this resource"
                        )
                    } else {
                        const newDevice = await deviceFound.update(args)
                        resolve(newDevice)
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - device mutation 116"))
                    log(e)
                    reject(
                        "116 - An internal error occured, please contact us. The error code is 116"
                    )
                }
            })
        )
    },
    floatValue: genericValueMutation(
        Value,
        ["boundaries", "precision"],
        "childFloatId",
        FloatValue,
        pubsub
    ),
    stringValue: genericValueMutation(
        Value,
        ["maxChars"],
        "childStringId",
        StringValue,
        pubsub
    ),
    booleanValue: genericValueMutation(
        Value,
        [],
        "childBoolId",
        BoolValue,
        pubsub
    ),
    colourValue: genericValueMutation(
        Value,
        [],
        "childColourId",
        ColourValue,
        pubsub
    ),
})

export default MutationResolver
