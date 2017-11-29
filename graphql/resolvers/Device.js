import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const DeviceResolver = (Device, User, Value) => ({
    createdAt(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject(
                                "Device does not exist. Use `CreateDevice` to create one."
                            )
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this user"
                            )
                        } else {
                            resolve(deviceFound.createdAt)
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - Device 111"))
                        log(e)
                        reject(
                            "111 - An internal error occured, please contact us. The error code is 111"
                        )
                    })
            })
        )
    },
    updatedAt(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject(
                                "Device does not exist. Use `CreateDevice` to create one."
                            )
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this user"
                            )
                        } else {
                            resolve(deviceFound.updatedAt)
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - Device 112"))
                        log(e)
                        reject(
                            "112 - An internal error occured, please contact us. The error code is 112"
                        )
                    })
            })
        )
    },
    deviceType(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject(
                                "Device does not exist. Use `CreateDevice` to create one."
                            )
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this user"
                            )
                        } else {
                            resolve(deviceFound.deviceType)
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - Device 113"))
                        log(e)
                        reject(
                            "113 - An internal error occured, please contact us. The error code is 113"
                        )
                    })
            })
        )
    },
    customName(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject(
                                "Device does not exist. Use `CreateDevice` to create one."
                            )
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this user"
                            )
                        } else {
                            resolve(deviceFound.customName)
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - Device 114"))
                        log(e)
                        reject(
                            "114 - An internal error occured, please contact us. The error code is 114"
                        )
                    })
            })
        )
    },
    tags(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Device.find({where: {id: root.id}})
                    .then(deviceFound => {
                        if (!deviceFound) {
                            reject(
                                "Device does not exist. Use `CreateDevice` to create one."
                            )
                        } else if (deviceFound.userId !== context.auth.userId) {
                            reject(
                                "You are not allowed to access details about this user"
                            )
                        } else {
                            resolve(deviceFound.tags)
                        }
                    })
                    .catch(e => {
                        log(chalk.red("INTERNAL ERROR - Device 115"))
                        log(e)
                        reject(
                            "115 - An internal error occured, please contact us. The error code is 115"
                        )
                    })
            })
        )
    },
})

export default DeviceResolver
