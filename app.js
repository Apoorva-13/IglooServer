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

const GRAPHQL_PORT = 3000

const graphQLServer = express()

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
            "'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MTMyNzQ1MzgsInVzZXJJZCI6IjY2MTUxOWMwLWRmNGUtNDVkZi1iYzA4LTYzYzk2ZDg1ODc5ZiJ9.YpRAmWBsMoN4NlMzAIofntO-Z8TtZ8RgvJ3771dq5vY'",
    })
)

export default graphQLServer
