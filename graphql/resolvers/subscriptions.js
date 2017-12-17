"use strict"

import {withFilter} from "graphql-subscriptions"
import {authenticated} from "./utilities.js"
import chalk from "chalk"
const log = console.log

const subscriptionResolver = pubsub => {
    return {
        deviceCreated: {
            subscribe: (root, args, context, info) => {
                if (context.auth) {
                    const myUserId = context.auth.userId
                    return withFilter(
                        () => pubsub.asyncIterator("deviceCreated"),
                        payload => {
                            return payload.userId === context.auth.userId
                        }
                    )(root, args, context, info)
                } else {
                    throw new Error("No authorization token")
                }
            },
        },
        valueCreated: {
            subscribe: (root, args, context, info) => {
                if (context.auth) {
                    const myUserId = context.auth.userId
                    return withFilter(
                        () => pubsub.asyncIterator("valueCreated"),
                        payload => {
                            return payload.userId === context.auth.userId
                        }
                    )(root, args, context, info)
                } else {
                    throw new Error("No authorization token")
                }
            },
        },
    }
}
export default subscriptionResolver
