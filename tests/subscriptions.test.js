const minimalGraphql = require("minimal-graphql")
const gql = require("graphql-tag")
const server = require("../server")
const GRAPHQL_PORT = process.env.PORT || 3000
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

describe("subscriptions", function() {
    const clientWithoutToken = minimalGraphql(
        {
            uri: `http://localhost:${GRAPHQL_PORT}/graphql`,
        },
        {
            uri: `ws://localhost:${GRAPHQL_PORT}/subscriptions`,
            options: {
                reconnect: true,
            },
        }
    )

    let authenticatedClient
    let authBearer
    let deviceId
    let floatValueId

    beforeAll(async () => {
        const res = await clientWithoutToken.mutate({
            mutation: gql`
                mutation {
                    SignupUser(
                        email: "userTestSubscription@gmail.com"
                        password: "password"
                    ) {
                        id
                        token
                    }
                }
            `,
        })

        const authBearer = res.data.SignupUser.token
        authenticatedClient = minimalGraphql(
            {
                uri: "http://localhost:3000/graphql",
                headers: {
                    Authorization: "Bearer " + authBearer,
                },
            },
            {
                uri: `ws://localhost:3000/subscriptions`,
                options: {
                    reconnect: true,
                    connectionParams: {
                        Authorization: "Bearer " + authBearer,
                    },
                },
            }
        )
    })

    it("should reject wrongly formatted authorization", async done => {
        const wrongTokenClient = minimalGraphql(
            {
                uri: "http://localhost:3000/graphql",
                headers: {
                    Authorization: "NotABearer ",
                },
            },
            {
                uri: `ws://localhost:3000/subscriptions`,
                options: {
                    reconnect: true,
                    connectionParams: {
                        Authorization: "NotABearer",
                    },
                },
            }
        )

        wrongTokenClient
            .subscribe({
                query: gql`
                    subscription {
                        deviceCreated {
                            id
                        }
                    }
                `,
            })
            .subscribe({
                next(res) {
                    expect(res.errors).toBeDefined()
                    expect(res.errors[0].message).toBe("No authorization token")
                    done()
                },
            })
    })
    it("deviceCreated subscription should work", done => {
        authenticatedClient
            .subscribe({
                query: gql`
                    subscription {
                        deviceCreated {
                            id
                            customName
                            deviceType
                            tags
                        }
                    }
                `,
            })
            .subscribe({
                async next(res) {
                    const device = res.data.deviceCreated

                    expect(res.errors).toBeUndefined()
                    expect(device.customName).toBe("Lampada")
                    expect(device.deviceType).toBe("Lamp")
                    expect(device.tags).toEqual([])

                    done()
                },
                error(e) {
                    throw new Error("Subscription error " + e)
                },
            })

        authenticatedClient
            .mutate({
                mutation: gql`
                    mutation {
                        CreateDevice(
                            customName: "Lampada"
                            deviceType: "Lamp"
                            tags: []
                        ) {
                            id
                        }
                    }
                `,
            })
            .then(res => {
                deviceId = res.data.CreateDevice.id
            })
            .catch(e => {
                throw new Error("Mutation error: " + e)
            })
    })

    it("deviceCreated shouldn't work if not authenticated", done => {
        clientWithoutToken
            .subscribe({
                query: gql`
                    subscription {
                        deviceCreated {
                            id
                            customName
                            deviceType
                            tags
                        }
                    }
                `,
            })
            .subscribe({
                async next(res) {
                    expect(res.errors).toBeDefined()
                    expect(res.errors[0].message).toBe("No authorization token")
                    done()
                },
                error(e) {
                    throw new Error("Subscription error " + e)
                },
            })
    })

    it("valueCreated subscription should work", done => {
        authenticatedClient
            .subscribe({
                query: gql`
                    subscription {
                        valueCreated {
                            id
                        }
                    }
                `,
            })
            .subscribe({
                async next(res) {
                    const device = res.data.valueCreated

                    expect(res.errors).toBeUndefined()

                    done()
                },
                error(e) {
                    throw new Error("Subscription error " + e)
                },
            })

        authenticatedClient
            .mutate({
                mutation: gql`
                    mutation($deviceId: ID!) {
                        CreateFloatValue(
                            deviceId: $deviceId
                            permission: READ_WRITE
                            relevance: NORMAL
                            value: 4
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    deviceId,
                },
            })
            .then(res => {
                floatValueId = res.data.CreateFloatValue.id
            })
            .catch(e => {
                throw new Error("Mutation error: " + e)
            })
    })

    it("valueCreated shouldn't work if not authenticated", done => {
        clientWithoutToken
            .subscribe({
                query: gql`
                    subscription {
                        valueCreated {
                            id
                        }
                    }
                `,
            })
            .subscribe({
                async next(res) {
                    expect(res.errors).toBeDefined()
                    expect(res.errors[0].message).toBe("No authorization token")
                    done()
                },
                error(e) {
                    throw new Error("Subscription error " + e)
                },
            })
    })
})
