import request from "supertest"
import GraphQLServer from "../app.js"

describe("Graphiql", function() {
    it("should work", done => {
        request(GraphQLServer)
            .get("/graphiql")
            .then(response => {
                expect(response.statusCode).toBe(200)
                done()
            })
    })
})
