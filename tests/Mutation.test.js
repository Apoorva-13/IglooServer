import request from "supertest"
import GraphQLServer from "../app.js"
import {generateAuthenticationToken} from "../graphql/resolvers/utilities"

require("dotenv").config()
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}

const {JWT_SECRET} = process.env
let self = {}

describe("Mutation", function() {
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
                expect(parsedRes.data.SignupUser.id).toBeTruthy()
                expect(parsedRes.data.SignupUser.token).toBeTruthy()
                expect(parsedRes.errors).toBeUndefined()
                self.userId = parsedRes.data.SignupUser.id // adding userid to the test suite object
                self.token = parsedRes.data.SignupUser.token
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
                expect(parsedRes.errors).toBeTruthy()
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
                expect(parsedRes.data.AuthenticateUser.id).toBeTruthy()
                expect(parsedRes.data.AuthenticateUser.token).toBeTruthy()
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
                expect(parsedRes.errors).toBeTruthy()
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
                expect(parsedRes.errors).toBeTruthy()
                expect(parsedRes.errors[0].message).toBe(
                    "User doesn't exist. Use `SignupUser` to create one"
                )
                done()
            })
    })

    it("should be able to change the password", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `mutation ChangePassword($newPassword: String!){
                            ChangePassword(newPassword: $newPassword){
                                id
                                token
                            }
                        }`,
                variables: {
                    newPassword: "newPassword",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeUndefined()
                expect(parsedRes.data.ChangePassword.id).toBeTruthy()
                expect(parsedRes.data.ChangePassword.token).toBeTruthy()
                expect(parsedRes.data.ChangePassword.id).toBe(self.userId)
                done()
            })
    })

    it("should not be able to change the password without a token", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation ChangePassword($newPassword: String!){
                            ChangePassword(newPassword: $newPassword){
                                id
                                token
                            }
                        }`,
                variables: {
                    newPassword: "newPassword",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeTruthy()
                expect(parsedRes.errors[0].message).toBe(
                    "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
                )
                done()
            })
    })

    it("should not be able to change the password of a user that doesn't exist anymore", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            // Creating a token referring to a wrong id
            // to emulate a user that doesn't exist anymore
            .set(
                "Authorization",
                "Bearer " +
                    generateAuthenticationToken(
                        "aaf5480f-b804-424d-bec8-3f7b363b5519",
                        JWT_SECRET
                    )
            )
            .send({
                query: `mutation ChangePassword($newPassword: String!){
                            ChangePassword(newPassword: $newPassword){
                                id
                                token
                            }
                        }`,
                variables: {
                    newPassword: "newPassword",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeTruthy()
                expect(parsedRes.errors[0].message).toBe(
                    "User doesn't exist. Use `SignupUser` to create one"
                )
                done()
            })
    })
})
