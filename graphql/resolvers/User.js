import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const UserResolver = (User, Device, Value) => ({
    email(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
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
                                resolve(userFound.email)
                            }
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - User 106"))
                            log(e)
                            reject(
                                "106 - An internal error occured, please contact us. The error code is 106"
                            )
                        })
                }
            })
        )
    },
    createdAt(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
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
                                resolve(userFound.createdAt)
                            }
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - User 107"))
                            log(e)
                            reject(
                                "107 - An internal error occured, please contact us. The error code is 107"
                            )
                        })
                }
            })
        )
    },
    updatedAt(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
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
                                resolve(userFound.updatedAt)
                            }
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - User 108"))
                            log(e)
                            reject(
                                "108 - An internal error occured, please contact us. The error code is 108"
                            )
                        })
                }
            })
        )
    },
    devices(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                if (context.auth.userId !== root.id) {
                    reject(
                        "You are not allowed to access details about this user"
                    )
                } else {
                    Device.findAll({where: {userId: root.id}})
                        .then(devices => {
                            resolve(devices)
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - User 109"))
                            log(e)
                            reject(
                                "109 - An internal error occured, please contact us. The error code is 109"
                            )
                        })
                }
            })
        )
    },
    values(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                if (context.auth.userId !== root.id) {
                    reject(
                        "You are not allowed to access details about this user"
                    )
                } else {
                    Value.findAll({where: {userId: root.id}})
                        .then(values => {
                            resolve(values)
                        })
                        .catch(e => {
                            log(chalk.red("INTERNAL ERROR - User 109"))
                            log(e)
                            reject(
                                "109 - An internal error occured, please contact us. The error code is 109"
                            )
                        })
                }
            })
        )
    },
})

export default UserResolver
