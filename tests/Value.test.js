import request from "supertest"
import GraphQLServer from "../app.js"

describe("Value", function() {
    let valueDatas = []

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

        valueDatas = [
            {
                idName: "valueId",
                mutationName: "CreateFloatValue",
                specificProps: [
                    {
                        name: "value",
                        type: "Float!",
                        value: 5,
                    },
                    {
                        name: "precision",
                        type: "Float",
                        value: 0.1,
                    },
                    {
                        name: "boundaries",
                        type: "[Float!]!",
                        value: [1, 2],
                    },
                ],
                token: self.token,
                deviceId: self.deviceId,
                email: "userTest4@email.com",
            },
            {
                idName: "valueId2",
                mutationName: "CreateFloatValue",
                specificProps: [
                    {
                        name: "value",
                        type: "Float!",
                        value: 5,
                    },
                ],
                token: self.token2,
                deviceId: self.deviceId2,
                email: "userTest5@email.com",
            },
            {
                idName: "stringValueId",
                mutationName: "CreateStringValue",
                specificProps: [
                    {
                        name: "value",
                        type: "String!",
                        value: "aaaa",
                    },
                    {
                        name: "maxChars",
                        type: "Int",
                        value: 10,
                    },
                ],
                token: self.token,
                deviceId: self.deviceId,
                email: "userTest4@email.com",
            },
            {
                idName: "stringValueId2",
                mutationName: "CreateStringValue",
                specificProps: [
                    {
                        name: "value",
                        type: "String!",
                        value: "aaaa",
                    },
                ],
                token: self.token2,
                deviceId: self.deviceId2,
                email: "userTest5@email.com",
            },
            {
                idName: "boolValueId",
                mutationName: "CreateBooleanValue",
                specificProps: [
                    {
                        name: "value",
                        type: "Boolean!",
                        value: true,
                    },
                ],
                token: self.token,
                deviceId: self.deviceId,
                email: "userTest4@email.com",
            },
            {
                idName: "boolValueId2",
                mutationName: "CreateBooleanValue",
                specificProps: [
                    {
                        name: "value",
                        type: "Boolean!",
                        value: false,
                    },
                ],
                token: self.token2,
                deviceId: self.deviceId2,
                email: "userTest5@email.com",
            },
        ]
    })

    it("should be able to add Values", async done => {
        const allPromises = []
        for (let i in valueDatas) {
            const fetchPromise = new Promise(async (resolve, reject) => {
                const {
                    idName,
                    mutationName,
                    specificProps,
                    token,
                    deviceId,
                    email,
                } = valueDatas[i]
                const queryVariables = {
                    deviceId,
                    permission: "READ_WRITE",
                    relevance: "MAIN",
                    valueDetails: "",
                }
                for (let i in specificProps) {
                    queryVariables[specificProps[i].name] =
                        specificProps[i].value
                }
                // sends a query passing the right specificProps and mutationName
                const res = await request(GraphQLServer)
                    .post("/graphql")
                    .set("content-type", "application/json")
                    .set("accept", "application/json")
                    .set("Authorization", "Bearer " + token)
                    .send({
                        query: `mutation ${mutationName}(
                            $deviceId: ID!
                            $permission: ValuePermission!
                            $relevance: ValueRelevance!
                            $valueDetails: String
                            ${specificProps
                                .map(prop => `$${prop.name}: ${prop.type}`)
                                .join("\n")}
                        ){
                            ${mutationName}(
                                deviceId: $deviceId,
                                permission: $permission,
                                relevance: $relevance,
                                valueDetails: $valueDetails,
                                ${specificProps
                                    .map(prop => `${prop.name}: $${prop.name}`)
                                    .join("\n")}
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
                                ${specificProps
                                    .map(prop => `${prop.name}`)
                                    .join("\n")}
                            }
                        }`,
                        variables: queryVariables,
                    })
                console.log(res.text)
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeUndefined()
                expect(parsedRes.data[mutationName].id).toBeTruthy()
                expect(parsedRes.data[mutationName].createdAt).toBeTruthy()
                expect(parsedRes.data[mutationName].updatedAt).toBeTruthy()
                expect(parsedRes.data[mutationName].device.id).toBe(deviceId)
                expect(parsedRes.data[mutationName].user.email).toBe(email)
                expect(parsedRes.data[mutationName].permission).toBe(
                    "READ_WRITE"
                )
                expect(parsedRes.data[mutationName].relevance).toBe("MAIN")
                expect(parsedRes.data[mutationName].valueDetails).toBe("")
                for (let i in specificProps) {
                    expect(
                        parsedRes.data[mutationName][specificProps[i].name]
                    ).toEqual(specificProps[i].value)
                }
                self[idName] = parsedRes.data[mutationName].id
                valueDatas[i].databaseId = parsedRes.data[mutationName].id
            })
            allPromises.push(fetchPromise)
        }
        return Promise.all(allPromises)
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
                                    ...on FloatValue{
                                        floatValue: value
                                    }
                                    ...on StringValue{
                                        stringValue: value
                                    }
                                    ...on BooleanValue{
                                        boolValue: value
                                    }
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
        expect(parsedRes.data.device.values.length).toBe(3)
        const idMap = parsedRes.data.device.values.map(el => el.id)

        for (let i in valueDatas) {
            if (!valueDatas[i].idName.endsWith("2")) {
                expect(idMap.indexOf(valueDatas[i].deviceId)).not.toBe(-1)
                if (valueDatas[i].mutationName.includes("Float")) {
                    expect(parsedRes.data.device.values[i].floatValue).toBe(
                        valueDatas[i].specificProps[0].value
                    )
                } else if (valueDatas[i].mutationName.includes("String")) {
                    expect(parsedRes.data.device.values[i].stringValue).toBe(
                        valueDatas[i].specificProps[0].value
                    )
                } else if (valueDatas[i].mutationName.includes("Boolean")) {
                    expect(parsedRes.data.device.values[i].boolValue).toBe(
                        valueDatas[i].specificProps[0].value
                    )
                }
            }
        }
        done()
    })
})
