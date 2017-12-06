import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const retrieveUserScalarProp = (User, prop) => {
    return (root, args, context) => {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                /* istanbul ignore if - this should never be the case, so the error is not reproducible */
                if (context.auth.userId !== root.id) {
                    reject(
                        "You are not allowed to access details about this user"
                    )
                } else {
                    User.find({where: {id: root.id}})
                        .then(userFound => {
                            if (!userFound) {
                                reject(
                                    "User doesn't exist. Use `SignupUser` to create one"
                                )
                            } else {
                                resolve(userFound[prop])
                            }
                        })
                        .catch(e => {
                            /* istanbul ignore next */
                            log(chalk.red("INTERNAL ERROR - User 106"))
                            /* istanbul ignore next */
                            log(e)
                            /* istanbul ignore next */
                            reject(
                                "106 - An internal error occured, please contact us. The error code is 106"
                            )
                        })
                }
            })
        )
    }
}
const UserResolver = (
    User,
    Device,
    Value,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue
) => ({
    email: retrieveUserScalarProp(User, "email"),
    createdAt: retrieveUserScalarProp(User, "createdAt"),
    updatedAt: retrieveUserScalarProp(User, "updatedAt"),
    devices(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    /* istanbul ignore if - this should never be the case, so the error is not reproducible */
                    if (context.auth.userId !== root.id) {
                        reject(
                            "You are not allowed to access details about this user"
                        )
                    } else {
                        const devices = await Device.findAll({
                            where: {userId: root.id},
                        })
                        resolve(devices)
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - User 107"))
                    log(e)
                    reject(
                        "109 - An internal error occured, please contact us. The error code is 107"
                    )
                }
            })
        )
    },
    values(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    /* istanbul ignore if - this should never be the case, so the error is not reproducible*/
                    if (context.auth.userId !== root.id) {
                        reject(
                            "You are not allowed to access details about this user"
                        )
                    } else {
                        const values = await Value.findAll({
                            where: {userId: root.id},
                            include: [
                                {
                                    model: FloatValue,
                                    required: false,
                                    as: "childFloat",
                                },
                                {
                                    model: StringValue,
                                    required: false,
                                    as: "childString",
                                },
                                {
                                    model: BoolValue,
                                    required: false,
                                    as: "childBool",
                                },
                                {
                                    model: ColourValue,
                                    required: false,
                                    as: "childColour",
                                },
                            ],
                        })
                        resolve(
                            values.map(value => {
                                if (value.dataValues.childFloat) {
                                    return {
                                        ...value.dataValues.childFloat
                                            .dataValues,
                                        ...value.dataValues,
                                        __resolveType: "FloatValue",
                                    }
                                } else if (value.dataValues.childString) {
                                    return {
                                        ...value.dataValues.childString
                                            .dataValues,
                                        ...value.dataValues,
                                        __resolveType: "StringValue",
                                    }
                                } else if (value.dataValues.childBool) {
                                    return {
                                        ...value.dataValues.childBool
                                            .dataValues,
                                        ...value.dataValues,
                                        __resolveType: "BooleanValue",
                                    }
                                } else if (value.dataValues.childColour) {
                                    return {
                                        ...value.dataValues.childColour
                                            .dataValues,
                                        ...value.dataValues,
                                        __resolveType: "ColourValue",
                                    }
                                } else {
                                    // should never happen
                                    /* istanbul ignore next */
                                    return {
                                        ...value.dataValues,
                                        __resolveType: null,
                                    }
                                }
                            })
                        )
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - User 108"))
                    log(e)
                    reject(
                        "110 - An internal error occured, please contact us. The error code is 108"
                    )
                }
            })
        )
    },
})

export default UserResolver
