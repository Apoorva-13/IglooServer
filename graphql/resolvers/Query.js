import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const QueryResolver = Device => ({
    user(root, args, context) {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                resolve({id: context.auth.userId})
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
                        reject("The requested resource does not exist")
                    } else if (deviceFound.userId !== context.auth.userId) {
                        reject(
                            "You are not allowed to access details about this resource"
                        )
                    } else {
                        const {
                            id,
                            updatedAt,
                            createdAt,
                            customName,
                            tags,
                            deviceType,
                            userId,
                        } = deviceFound
                        resolve({
                            id,
                            updatedAt,
                            createdAt,
                            customName,
                            tags,
                            deviceType,
                            user: {
                                id: userId,
                            },
                        })
                    }
                } catch (e) {
                    log(chalk.red("INTERNAL ERROR - Query device 105"))
                    log(e)
                    reject(
                        "105 - An internal error occured, please contact us. The error code is 105"
                    )
                }
            })
        )
    },
})

export default QueryResolver
