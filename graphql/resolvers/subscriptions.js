import {withFilter} from "graphql-subscriptions"
import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const subscriptionResolver = pubsub => {
    return {
        deviceCreated: {
            subscribe: (root, args, context, info) => {
                console.log(chalk.bgGreen("subscribed"), context)
                if (context.auth) {
                    const myUserId = context.auth.userId
                    return withFilter(
                        () => pubsub.asyncIterator("deviceCreated"),
                        payload => {
                            console.log(
                                chalk.bgBlue(
                                    payload.userId === context.auth.userId
                                ),
                                payload.userId,
                                context.auth.userId,
                                myUserId
                            )
                            return payload.userId === context.auth.userId
                        }
                    )(root, args, context, info)
                } else {
                    console.log(chalk.bgYellow("NO AUTH"))
                    throw new Error("No authorization token")
                }
            },
        },
    }
}
export default subscriptionResolver
