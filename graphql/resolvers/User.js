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
const UserResolver = (User, Device, Value) => ({
    email: retrieveUserScalarProp(User, "email"),
    createdAt: retrieveUserScalarProp(User, "createdAt"),
    updatedAt: retrieveUserScalarProp(User, "updatedAt"),
    devices(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                /* istanbul ignore if - this should never be the case, so the error is not reproducible */
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
                            /* istanbul ignore next */
                            log(chalk.red("INTERNAL ERROR - User 107"))
                            /* istanbul ignore next */
                            log(e)
                            /* istanbul ignore next */
                            reject(
                                "109 - An internal error occured, please contact us. The error code is 107"
                            )
                        })
                }
            })
        )
    },
    values(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                /* istanbul ignore if - this should never be the case, so the error is not reproducible*/
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
                            /* istanbul ignore next */
                            log(chalk.red("INTERNAL ERROR - User 108"))
                            /* istanbul ignore next */
                            log(e)
                            /* istanbul ignore next */
                            reject(
                                "110 - An internal error occured, please contact us. The error code is 108"
                            )
                        })
                }
            })
        )
    },
})

export default UserResolver
