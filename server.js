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

const GRAPHQL_PORT = 3000

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
                console.log(chalk.bgBlue("TRYING TO CONNECT"), connectionParams)
                if (!connectionParams.Authorization) {
                    console.log(chalk.bgYellow("NO AUTHORIZATION"))
                    return false
                } else if (
                    !connectionParams.Authorization.startsWith("Bearer ")
                ) {
                    console.log(chalk.bgYellow("NOT A BEARER TOKEN"))
                    return false
                } else {
                    try {
                        const decodedJwt = jwt.decode(
                            connectionParams.Authorization.substring(7),
                            process.env.JWT_SECRET
                        )
                        console.log(chalk.bgGreen("connected"), decodedJwt)
                        return {auth: decodedJwt}
                    } catch (e) {
                        console.log(chalk.bgRed("internal error"))
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
