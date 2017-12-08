import {withFilter} from "graphql-subscriptions"
import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const subscriptionResolver = pubsub => {
    return {
        deviceCreated: {
            subscribe: (root, args, context, info) => {
                if (context.auth) {
                    return withFilter(
                        () => pubsub.asyncIterator("deviceCreated"),
                        payload => {
                            return payload.userId === context.auth.userId
                        }
                    )(root, args, context, info)
                } else {
                    return false
                }
            },
        },
    }
}
export default subscriptionResolver
