require("dotenv").config()
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
    })
)

export default graphQLServer
