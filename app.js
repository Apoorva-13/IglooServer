require("dotenv").config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}
import express from "express"
import {graphqlExpress, graphiqlExpress} from "apollo-server-express"
import bodyParser from "body-parser"
import schema from "./graphql/schema"
import expressJwt from "express-jwt"
import expressPlayground from "graphql-playground-middleware-express"
import cors from "cors"

const GRAPHQL_PORT = 3000

const graphQLServer = express()

graphQLServer.use(cors())
graphQLServer.use(
    "/graphql",
    bodyParser.json(),
    expressJwt({secret: process.env.JWT_SECRET, credentialsRequired: false}),
    graphqlExpress(req => ({
        schema,
        context: {
            auth: req.user,
        },
    }))
)
graphQLServer.get("/graphiql", function(req, res, next) {
    console.log(req.query.bearer)
    if (req.query.bearer) {
        return graphiqlExpress({
            endpointURL: "/graphql",
            subscriptionsEndpoint: `ws://localhost:${GRAPHQL_PORT}/subscriptions`,
            passHeader: `'Authorization': 'Bearer ${req.query.bearer}'`,
            websocketConnectionParams: {
                Authorization: `Bearer ${req.query.bearer}`,
            },
        })(req, res, next)
    } else {
        return graphiqlExpress({
            endpointURL: "/graphql",
            subscriptionsEndpoint: `ws://localhost:${GRAPHQL_PORT}/subscriptions`,
        })(req, res, next)
    }
})
graphQLServer.get(
    "/playground",
    expressPlayground({
        // endpoint: "/graphql",
        // subscriptionEndpoint: "/subscriptions",
        setTitle: "Igloo Playground",
    })
)

export default graphQLServer
