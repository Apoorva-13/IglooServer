import {authenticated, retrieveScalarProp} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const DeviceResolver = (
    Device,
    User,
    Value,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColorValue
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
                    /* istanbul ignore next */
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
                                // {
                                //     model: StringValue,
                                //     required: false,
                                //     as: "childString",
                                // },
                            ],
                        })
                        resolve(
                            values.map(value => {
                                if (value.dataValues.childFloat) {
                                    return {
                                        ...value.dataValues,
                                        ...value.dataValues.childFloat
                                            .dataValues, // childFloat second so that its id, createdAt, ... are selected
                                        __resolveType: "FloatValue",
                                    }
                                    // } else if (values.dataValues.childString) {
                                    //     return {
                                    //         ...value.dataValues,
                                    //         ...value.dataValues.childString
                                    //             .dataValues, // childFloat second so that its id, createdAt, ... are selected
                                    //         __resolveType: "StringValue",
                                    //     }
                                } else {
                                    return {
                                        ...value.dataValues,
                                        __resolveType: null,
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
