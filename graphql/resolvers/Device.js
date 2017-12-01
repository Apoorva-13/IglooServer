import {authenticated, retrieveScalarProp} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const DeviceResolver = (Device, User, Value) => ({
    createdAt: retrieveScalarProp(Device, "createdAt"),
    updatedAt: retrieveScalarProp(Device, "updatedAt"),
    deviceType: retrieveScalarProp(Device, "deviceType"),
    customName: retrieveScalarProp(Device, "customName"),
    tags: retrieveScalarProp(Device, "tags"),
    values(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject("The requested resource does not exist")
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this resource"
                            )
                        } else {
                            Value.findAll({
                                where: {deviceId: deviceFound.id},
                            }).then(values => {
                                resolve(values)
                            })
                        }
                    })
                    .catch(e => {
                        /* istanbul ignore next */
                        log(chalk.red("INTERNAL ERROR - Device 110"))
                        /* istanbul ignore next */
                        log(e)
                        /* istanbul ignore next */
                        reject(
                            "110 - An internal error occured, please contact us. The error code is 110"
                        )
                    })
            })
        )
    },
    user(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject("The requested resource does not exist")
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this resource"
                            )
                        } else {
                            // the User resolver will take care of loading the other props,
                            // it only needs to know the user id
                            resolve({
                                id: deviceFound.userId,
                            })
                        }
                    })
                    .catch(e => {
                        /* istanbul ignore next */
                        log(chalk.red("INTERNAL ERROR - Device 111"))
                        /* istanbul ignore next */
                        log(e)
                        /* istanbul ignore next */
                        reject(
                            "111 - An internal error occured, please contact us. The error code is 111"
                        )
                    })
            })
        )
    },
})

export default DeviceResolver
