"use strict"

import {authenticated, logErrorsPromise} from "./utilities.js"

const retrieveUserScalarProp = (User, prop) => {
    return (root, args, context) => {
        return logErrorsPromise(
            "retrieveScalarProp",
            106,
            authenticated(context, async (resolve, reject) => {
                /* istanbul ignore if - this should never be the case, so the error is not reproducible */
                if (context.auth.userId !== root.id) {
                    reject(
                        "You are not allowed to access details about this user"
                    )
                } else {
                    const userFound = await User.find({where: {id: root.id}})
                    if (!userFound) {
                        reject(
                            "User doesn't exist. Use `SignupUser` to create one"
                        )
                    } else {
                        resolve(userFound[prop])
                    }
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
        return logErrorsPromise(
            "User devices resolver",
            107,
            authenticated(context, async (resolve, reject) => {
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
            })
        )
    },
    values(root, args, context) {
        return logErrorsPromise(
            "User values resolver",
            108,
            authenticated(context, async (resolve, reject) => {
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
                                    ...value.dataValues.childFloat.dataValues,
                                    ...value.dataValues,
                                    __resolveType: "FloatValue",
                                }
                            } else if (value.dataValues.childString) {
                                return {
                                    ...value.dataValues.childString.dataValues,
                                    ...value.dataValues,
                                    __resolveType: "StringValue",
                                }
                            } else if (value.dataValues.childBool) {
                                return {
                                    ...value.dataValues.childBool.dataValues,
                                    ...value.dataValues,
                                    __resolveType: "BooleanValue",
                                }
                            } else {
                                return {
                                    ...value.dataValues.childColour.dataValues,
                                    ...value.dataValues,
                                    __resolveType: "ColourValue",
                                }
                            }
                        })
                    )
                }
            })
        )
    },
})

export default UserResolver
