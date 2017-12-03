import request from "supertest"
import GraphQLServer from "../app.js"

describe("Value", function() {
    beforeAll(async () => {
        // creating 2 accounts and 2 devices to perform all the operations
        const res = await request(GraphQLServer)
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
                    email: "userTest4@email.com",
                    password: "password",
                },
            })
        const parsedRes = JSON.parse(res.text)
        self.userId = parsedRes.data.SignupUser.id
        self.token = parsedRes.data.SignupUser.token

        const resB = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `mutation CreateDevice{
                            CreateDevice(tags: []){
                                id
                            }
                        }
                        `,
            })
        const parsedResB = JSON.parse(resB.text)
        expect(parsedResB.errors).toBeUndefined()
        expect(parsedResB.data.CreateDevice.id).toBeTruthy()
        self.deviceId = parsedResB.data.CreateDevice.id

        const res2 = await request(GraphQLServer)
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
                    email: "userTest5@email.com",
                    password: "password",
                },
            })
        const parsedRes2 = JSON.parse(res2.text)
        expect(parsedRes2.data.SignupUser.id).toBeTruthy()
        expect(parsedRes2.data.SignupUser.token).toBeTruthy()
        expect(parsedRes2.errors).toBeUndefined()
        self.userId2 = parsedRes2.data.SignupUser.id
        self.token2 = parsedRes2.data.SignupUser.token

        const res2B = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token2)
            .send({
                query: `mutation CreateDevice{
                            CreateDevice(tags: []){
                                id
                            }
                        }
                        `,
            })
        const parsedRes2B = JSON.parse(res2B.text)
        expect(parsedRes2B.data.CreateDevice.id).toBeTruthy()
        self.deviceId2 = parsedRes2B.data.CreateDevice.id
    })

    it("should be able to add a FloatValue", async done => {
        const res = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `mutation CreateFloatValue(
                            $deviceId: ID!
                            $permission: ValuePermission!
                            $relevance: ValueRelevance!
                            $valueDetails: String
                            $value: Float!
                            $precision: Float
                            $boundaries: [Float!]
                        ){
                            CreateFloatValue(
                                deviceId: $deviceId,
                                permission: $permission,
                                relevance: $relevance,
                                valueDetails: $valueDetails,
                                value: $value,
                                precision: $precision,
                                boundaries: $boundaries
                            ){
                                id
                                createdAt
                                updatedAt
                                device{
                                    id
                                }
                                user{
                                    email
                                }
                                permission
                                relevance
                                valueDetails
                                value
                                precision
                                boundaries
                            }
                        }`,
                variables: {
                    deviceId: self.deviceId,
                    permission: "READ_WRITE",
                    relevance: "MAIN",
                    valueDetails: "",
                    value: 5,
                    precision: 0.1,
                    boundaries: [1, 2],
                },
            })
        const parsedRes = JSON.parse(res.text)
        expect(parsedRes.errors).toBeUndefined()
        expect(parsedRes.data.CreateFloatValue.id).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.createdAt).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.updatedAt).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.device.id).toBe(self.deviceId)
        expect(parsedRes.data.CreateFloatValue.user.email).toBe(
            "userTest4@email.com"
        )
        expect(parsedRes.data.CreateFloatValue.permission).toBe("READ_WRITE")
        expect(parsedRes.data.CreateFloatValue.relevance).toBe("MAIN")
        expect(parsedRes.data.CreateFloatValue.valueDetails).toBe("")
        expect(parsedRes.data.CreateFloatValue.value).toBe(5)
        expect(parsedRes.data.CreateFloatValue.precision).toBe(0.1)
        expect(parsedRes.data.CreateFloatValue.boundaries).toEqual([1, 2])
        self.valueId = parsedRes.data.CreateFloatValue.id
        done()
    })

    it("should be able to add a FloatValue without unnecessary parameters", async done => {
        const res = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token2)
            .send({
                query: `mutation CreateFloatValue(
                            $deviceId: ID!
                            $permission: ValuePermission!
                            $relevance: ValueRelevance!
                            $value: Float!
                        ){
                            CreateFloatValue(
                                deviceId: $deviceId,
                                value: $value,
                                permission:$permission,
                                relevance:$relevance
                            ){
                                id
                                createdAt
                                updatedAt
                                device{
                                    id
                                }
                                user{
                                    email
                                }
                                permission
                                relevance
                                valueDetails
                                value
                                precision
                                boundaries
                            }
                        }`,
                variables: {
                    deviceId: self.deviceId2,
                    value: 5,
                    permission: "READ_ONLY",
                    relevance: "MAIN",
                },
            })
        const parsedRes = JSON.parse(res.text)
        expect(parsedRes.errors).toBeUndefined()
        expect(parsedRes.data.CreateFloatValue.id).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.createdAt).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.updatedAt).toBeTruthy()
        expect(parsedRes.data.CreateFloatValue.device.id).toBe(self.deviceId2)
        expect(parsedRes.data.CreateFloatValue.user.email).toBe(
            "userTest5@email.com"
        )
        expect(parsedRes.data.CreateFloatValue.permission).toBe("READ_ONLY")
        expect(parsedRes.data.CreateFloatValue.relevance).toBe("MAIN")
        expect(parsedRes.data.CreateFloatValue.valueDetails).toBeNull()
        expect(parsedRes.data.CreateFloatValue.value).toBe(5)
        expect(parsedRes.data.CreateFloatValue.precision).toBeNull()
        expect(parsedRes.data.CreateFloatValue.boundaries).toBeNull()
        self.valueId2 = parsedRes.data.CreateFloatValue.id
        done()
    })

    it("should not be able to create a value under a foreign device", async done => {
        const res = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `mutation CreateFloatValue(
                            $deviceId: ID!
                            $permission: ValuePermission!
                            $relevance: ValueRelevance!
                            $value: Float!
                        ){
                            CreateFloatValue(
                                deviceId: $deviceId,
                                value: $value,
                                permission:$permission,
                                relevance:$relevance
                            ){
                                id
                            }
                        }`,
                variables: {
                    deviceId: self.deviceId2,
                    value: 5,
                    permission: "READ_ONLY",
                    relevance: "MAIN",
                },
            })
        const parsedRes = JSON.parse(res.text)
        expect(parsedRes.errors).toBeTruthy()
        expect(parsedRes.errors[0].message).toBe(
            "You are not allowed to edit details about this device"
        )
        done()
    })

    it("should not be able to create a value under a device that does not exist", async done => {
        const res = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `mutation CreateFloatValue(
                            $deviceId: ID!
                            $permission: ValuePermission!
                            $relevance: ValueRelevance!
                            $value: Float!
                        ){
                            CreateFloatValue(
                                deviceId: $deviceId,
                                value: $value,
                                permission:$permission,
                                relevance:$relevance
                            ){
                                id
                            }
                        }`,
                variables: {
                    deviceId: "88b2fb06-be2f-482a-8c88-59d90566992d", // fake id
                    value: 5,
                    permission: "READ_ONLY",
                    relevance: "MAIN",
                },
            })
        const parsedRes = JSON.parse(res.text)
        expect(parsedRes.errors).toBeTruthy()
        expect(parsedRes.errors[0].message).toBe(
            "The supplied deviceId does not exist"
        )
        done()
    })

    it("should be listed in a device's values", async done => {
        const res = await request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `query device($id:ID!){
                            device(id:$id){
                                values{
                                    id
                                }
                            }
                        }
                `,
                variables: {
                    id: self.deviceId,
                },
            })
        const parsedRes = JSON.parse(res.text)
        expect(parsedRes.errors).toBeUndefined()
        expect(parsedRes.data.device.values.length).toBe(1)
        expect(parsedRes.data.device.values[0].id).toBe(self.valueId)
        done()
    })
})
