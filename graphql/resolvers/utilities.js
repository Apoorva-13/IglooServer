import jwt from "jwt-simple"
import moment from "moment"
import chalk from "chalk"
const log = console.log
const JWT_EXPIRE_DAYS = 7

const authenticated = (context, callback) =>
    context.auth
        ? callback
        : (resolve, reject) =>
              reject(
                  "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
              )

const generateAuthenticationToken = (userId, JWT_SECRET) =>
    jwt.encode(
        {
            exp: moment()
                .utc()
                .add({days: JWT_EXPIRE_DAYS})
                .unix(),
            userId,
        },
        JWT_SECRET
    )

const retrieveScalarProp = (Model, prop) => {
    return (root, args, context) => {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const resourceFound = await Model.find({
                        where: {id: root.id},
                    })
                    /* istanbul ignore next */
                    if (!resourceFound) {
                        reject("The requested resource does not exist")
                    } else if (resourceFound.userId !== context.auth.userId) {
                        /* istanbul ignore next */
                        reject(
                            "You are not allowed to access details about this resource"
                        )
                    } else {
                        resolve(resourceFound[prop])
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - retrieveScalarProp 109"))
                    log(e)
                    reject(
                        "109 - An internal error occured, please contact us. The error code is 109"
                    )
                }
            })
        )
    }
}

// generic resolver for CreateXValue mutations
const CreateGenericValue = (
    Device,
    Value,
    childProps,
    childName,
    childModel,
    pubsub
) => {
    return (root, args, context) => {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                // looks for the device, if the device is owned by the user
                // creates a Value in the database and returns
                try {
                    const deviceFound = await Device.find({
                        where: {id: args.deviceId},
                    })
                    if (!deviceFound) {
                        reject("The supplied deviceId does not exist")
                    } else if (deviceFound.userId !== context.auth.userId) {
                        reject(
                            "You are not allowed to edit details about this device"
                        )
                    } else {
                        const {
                            deviceId,
                            valueDetails,
                            permission,
                            relevance,
                            value,
                        } = args

                        const childGeneric = {}
                        // loads in childGeneric all the required props from args
                        for (let i in childProps) {
                            childGeneric[childProps[i]] = args[childProps[i]]
                        }

                        // creates the value and the associated FloatValue/StringValue/...
                        const newValue = await Value.create(
                            {
                                userId: context.auth.userId,
                                deviceId,
                                valueDetails,
                                permission,
                                relevance,
                                [childName]: {
                                    userId: context.auth.userId,
                                    value,
                                    ...childGeneric,
                                },
                            },
                            {
                                include: [
                                    {
                                        model: childModel,
                                        as: childName,
                                    },
                                ],
                            }
                        )

                        const resolveObj = {
                            id: newValue.id,
                            createdAt: newValue[childName].createdAt,
                            updatedAt: newValue[childName].updatedAt,
                            device: {
                                id: newValue.deviceId,
                            },
                            user: {
                                id: newValue.userId,
                            },
                            permission: newValue.permission,
                            relevance: newValue.relevance,
                            valueDetails: newValue.valueDetails,
                            value: newValue[childName].value,
                            __resolveType:
                                childName === "childFloat"
                                    ? "FloatValue"
                                    : childName === "childString"
                                      ? "StringValue"
                                      : childName === "childBool"
                                        ? "BooleanValue"
                                        : "ColourValue",
                        }
                        // loads in resolveObj all the required props from args
                        for (let i in childProps) {
                            resolveObj[childProps[i]] =
                                newValue[childName][childProps[i]]
                        }

                        pubsub.publish("valueCreated", {
                            valueCreated: resolveObj,
                            userId: context.auth.userId,
                        })

                        resolve(resolveObj)
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - CreateGenericValue 112"))
                    log(e)
                    reject(
                        "112 - An internal error occured, please contact us. The error code is 112"
                    )
                }
            })
        )
    }
}

const getPropsIfDefined = (args, props) => {
    const propObject = {}
    for (let i = 0; i < props.length; i++) {
        if (args[props[i]]) {
            propObject[props[i]] = args[props[i]]
        }
    }

    return propObject
}
module.exports = {
    authenticated,
    generateAuthenticationToken,
    retrieveScalarProp,
    CreateGenericValue,
    getPropsIfDefined,
}
