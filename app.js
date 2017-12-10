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
graphQLServer.use(
    "/graphiql",
    graphiqlExpress({
        endpointURL: "/graphql",
        subscriptionsEndpoint: `ws://localhost:${GRAPHQL_PORT}/subscriptions`,
        passHeader:
            "'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MTMzNDQ0NTMsInVzZXJJZCI6IjBkNGNkMmUzLTFmYzYtNGQ0Yy1iNGU1LTVkOWMwZTVhNzM3YiJ9.pzB60ipb1MasOe6--Eu3OsMPWhn0tTYL-rkBrD3rhWY'",
    })
)
graphQLServer.get(
    "/playground",
    expressPlayground({
        // endpoint: "/graphql",
        // subscriptionEndpoint: "/subscriptions",
        setTitle: "Igloo Playground",
    })
)

export default graphQLServer
