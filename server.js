"use strict"

require("dotenv").config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}
import graphQLServer from "./app.js"
import {SubscriptionServer} from "subscriptions-transport-ws"
import {execute, subscribe} from "graphql"
import jwt from "jwt-simple"
import chalk from "chalk"
const {createServer} = require("http")
import schema from "./graphql/schema"

const GRAPHQL_PORT = process.env.PORT || 3000

const httpServer = createServer(graphQLServer)
httpServer.listen(GRAPHQL_PORT, () => {
    console.log(
        `GraphiQL is now running on http://localhost:${GRAPHQL_PORT}/graphiql`
    )

    new SubscriptionServer(
        {
            execute,
            subscribe,
            schema,
            onConnect: connectionParams => {
                if (!connectionParams.Authorization) {
                    return false
                } else if (
                    !connectionParams.Authorization.startsWith("Bearer ")
                ) {
                    return false
                } else {
                    try {
                        const decodedJwt = jwt.decode(
                            connectionParams.Authorization.substring(7),
                            process.env.JWT_SECRET
                        )
                        return {auth: decodedJwt}
                    } catch (e) /* istanbul ignore next */ {
                        console.log(chalk.bgRed("internal error - server.js"))
                        console.log(e)
                        return false
                    }
                }
            },
        },
        {
            server: httpServer,
            path: "/subscriptions",
        }
    )
})

module.exports = httpServer
