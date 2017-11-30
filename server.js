import graphQLServer from "./app.js"

const GRAPHQL_PORT = 3000

graphQLServer.listen(GRAPHQL_PORT, () =>
    console.log(
        `GraphiQL is now running on http://localhost:${GRAPHQL_PORT}/graphiql`
    )
)
