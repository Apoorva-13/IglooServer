import {authenticated, retrieveScalarProp} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const DeviceResolver = (
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
) => ({
    createdAt: retrieveScalarProp(Device, "createdAt"),
    updatedAt: retrieveScalarProp(Device, "updatedAt"),
    deviceType: retrieveScalarProp(Device, "deviceType"),
    customName: retrieveScalarProp(Device, "customName"),
    tags: retrieveScalarProp(Device, "tags"),
    values(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const deviceFound = await Device.find({
                        where: {id: root.id},
                    })
                    /* istanbul ignore if */
                    if (!deviceFound) {
                        reject("The requested resource does not exist")
                    } else if (deviceFound.userId !== context.auth.userId) {
                        /* istanbul ignore next */
                        reject(
                            "You are not allowed to access details about this resource"
                        )
                    } else {
                        const values = await Value.findAll({
                            where: {deviceId: deviceFound.id},
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
                                }
                            })
                        )
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - Device 110"))
                    log(e)
                    reject(
                        "110 - An internal error occured, please contact us. The error code is 110"
                    )
                }
            })
        )
    },
    user(root, args, context) {
        return new Promise(
            authenticated(context, async (resolve, reject) => {
                try {
                    const deviceFound = await Device.find({
                        where: {id: root.id},
                    })
                    /* istanbul ignore next */
                    if (!deviceFound) {
                        reject("The requested resource does not exist")
                    } else if (deviceFound.userId !== context.auth.userId) {
                        /* istanbul ignore next */
                        reject(
                            "You are not allowed to access details about this resource"
                        )
                    } else {
                        // the User resolver will take care of loading the other props,
                        // it only needs to know the user id
                        resolve({id: deviceFound.userId})
                    }
                } catch (e) /* istanbul ignore next */ {
                    log(chalk.red("INTERNAL ERROR - Device 111"))
                    log(e)
                    reject(
                        "111 - An internal error occured, please contact us. The error code is 111"
                    )
                }
            })
        )
    },
})

export default DeviceResolver
