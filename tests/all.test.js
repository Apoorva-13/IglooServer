import request from "supertest"
import GraphQLServer from "../app.js"

// fakes graphql parsing, so that code editors colorize the string
const gql = text => text

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
describe("A user", function() {
    it("should be able to signup", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation SignupUser($email: String!, $password: String!) {
                        SignupUser(email: $email, password: $password) {
                            id
                            token
                        }
                    }
                `,
                variables: {
                    email: "giorgio@gianni.com",
                    password: "password",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.data.SignupUser.id).toBeDefined()
                expect(parsedRes.data.SignupUser.token).toBeDefined()
                expect(parsedRes.errors).toBeUndefined()
                self.tempID = parsedRes.data.SignupUser.id // adding userid to the test suite object
                self.tempToken = parsedRes.data.SignupUser.token
                done()
            })
    })

    it("should not be able to signup if the email is already taken", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation SignupUser($email: String!, $password: String!) {
                        SignupUser(email: $email, password: $password) {
                            id
                            token
                        }
                    }
                `,
                variables: {
                    email: "giorgio@gianni.com",
                    password: "password",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeDefined()
                expect(parsedRes.errors[0].message).toBe(
                    "A user with this email already exists"
                )
                done()
            })
    })

    it("should be able to authenticate", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation AuthenticateUser($email: String!, $password: String!){
                    AuthenticateUser(email: $email, password: $password){
                        id
                        token
                    }
                }`,
                variables: {
                    email: "giorgio@gianni.com",
                    password: "password",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.data.AuthenticateUser.id).toBeDefined()
                expect(parsedRes.data.AuthenticateUser.token).toBeDefined()
                expect(parsedRes.errors).toBeUndefined()
                done()
            })
    })

    it("should not be able to authenticate with an incorrect password", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation AuthenticateUser($email: String!, $password: String!){
                    AuthenticateUser(email: $email, password: $password){
                        id
                        token
                    }
                }`,
                variables: {
                    email: "giorgio@gianni.com",
                    password: "wrongpassword",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeDefined()
                expect(parsedRes.errors[0].message).toBe("Wrong password")
                done()
            })
    })

    it("should not be able to authenticate if the account doesn't exist", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation AuthenticateUser($email: String!, $password: String!){
                    AuthenticateUser(email: $email, password: $password){
                        id
                        token
                    }
                }`,
                variables: {
                    email: "inexistent@account.com",
                    password: "password",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeDefined()
                expect(parsedRes.errors[0].message).toBe(
                    "User doesn't exist. Use `SignupUser` to create one"
                )
                done()
            })
    })
})
