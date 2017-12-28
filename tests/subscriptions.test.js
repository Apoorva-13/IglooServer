const minimalGraphql = require('minimal-graphql')
const gql = require('graphql-tag')
require('../server')

const GRAPHQL_PORT = process.env.PORT || 3000
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

describe('subscriptions', () => {
  const clientWithoutToken = minimalGraphql(
    {
      uri: `http://localhost:${GRAPHQL_PORT}/graphql`,
    },
    {
      uri: `ws://localhost:${GRAPHQL_PORT}/subscriptions`,
      options: {
        reconnect: true,
      },
    },
  )

  let authenticatedClient
  let deviceId
  let floatValueId
  let stringValueId
  let boolValueId
  let colourValueId

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
        uri: 'http://localhost:3000/graphql',
        headers: {
          Authorization: `Bearer ${authBearer}`,
        },
      },
      {
        uri: 'ws://localhost:3000/subscriptions',
        options: {
          reconnect: true,
          connectionParams: {
            Authorization: `Bearer ${authBearer}`,
          },
        },
      },
    )
  })

  it('should reject wrongly formatted authorization', async (done) => {
    const wrongTokenClient = minimalGraphql(
      {
        uri: 'http://localhost:3000/graphql',
        headers: {
          Authorization: 'NotABearer ',
        },
      },
      {
        uri: 'ws://localhost:3000/subscriptions',
        options: {
          reconnect: true,
          connectionParams: {
            Authorization: 'NotABearer',
          },
        },
      },
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
          expect(res.errors[0].message).toBe('No authorization token')
          done()
        },
      })
  })
  it('deviceCreated subscription should work', (done) => {
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
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const device = res.data.deviceCreated
          expect(device.customName).toBe('Lampada')
          expect(device.deviceType).toBe('Lamp')
          expect(device.tags).toEqual([])

          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    authenticatedClient
      .mutate({
        mutation: gql`
          mutation {
            CreateDevice(customName: "Lampada", deviceType: "Lamp", tags: []) {
              id
            }
          }
        `,
      })
      .then((res) => {
        deviceId = res.data.CreateDevice.id
      })
      .catch((e) => {
        throw new Error(`Mutation error: ${e}`)
      })
  })

  it("deviceCreated shouldn't work if not authenticated", (done) => {
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
          expect(res.errors[0].message).toBe('No authorization token')
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })
  })

  it('valueCreated subscription should work with floatValue', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            valueCreated {
              id
              permission
              relevance
              ... on FloatValue {
                value
              }
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const value = res.data.valueCreated
          expect(value.id).toBeDefined()
          expect(value.permission).toBe('READ_WRITE')
          expect(value.relevance).toBe('NORMAL')
          expect(value.value).toBe(4)

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    const res = await authenticatedClient.mutate({
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
    floatValueId = res.data.CreateFloatValue.id
  })

  it('valueCreated subscription should work with stringValue', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            valueCreated {
              id
              permission
              relevance
              ... on StringValue {
                value
              }
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const value = res.data.valueCreated
          expect(value.id).toBeDefined()
          expect(value.permission).toBe('READ_WRITE')
          expect(value.relevance).toBe('NORMAL')
          expect(value.value).toBe('ehiehie')

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    const res = await authenticatedClient.mutate({
      mutation: gql`
        mutation($deviceId: ID!) {
          CreateStringValue(
            deviceId: $deviceId
            permission: READ_WRITE
            relevance: NORMAL
            value: "ehiehie"
          ) {
            id
          }
        }
      `,
      variables: {
        deviceId,
      },
    })
    stringValueId = res.data.CreateStringValue.id
  })

  it('valueCreated subscription should work with booleanValue', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            valueCreated {
              id
              permission
              relevance
              ... on BooleanValue {
                value
              }
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const value = res.data.valueCreated
          expect(value.id).toBeDefined()
          expect(value.permission).toBe('READ_WRITE')
          expect(value.relevance).toBe('NORMAL')
          expect(value.value).toBe(true)

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    const res = await authenticatedClient.mutate({
      mutation: gql`
        mutation($deviceId: ID!) {
          CreateBooleanValue(
            deviceId: $deviceId
            permission: READ_WRITE
            relevance: NORMAL
            value: true
          ) {
            id
          }
        }
      `,
      variables: {
        deviceId,
      },
    })
    boolValueId = res.data.CreateBooleanValue.id
  })

  it('valueCreated subscription should work with colourValue', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            valueCreated {
              id
              permission
              relevance
              ... on ColourValue {
                value
              }
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const value = res.data.valueCreated
          expect(value.id).toBeDefined()
          expect(value.permission).toBe('READ_WRITE')
          expect(value.relevance).toBe('NORMAL')
          expect(value.value).toBe('#00ff00')

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    const res = await authenticatedClient.mutate({
      mutation: gql`
        mutation($deviceId: ID!) {
          CreateColourValue(
            deviceId: $deviceId
            permission: READ_WRITE
            relevance: NORMAL
            value: "#00ff00"
          ) {
            id
          }
        }
      `,
      variables: {
        deviceId,
      },
    })
    colourValueId = res.data.CreateColourValue.id
  })

  it("valueCreated shouldn't work if not authenticated", (done) => {
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
          expect(res.errors[0].message).toBe('No authorization token')
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })
  })

  it('userUpdated subscription should work', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            userUpdated {
              id
              email
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const user = res.data.userUpdated
          expect(user.id).toBeDefined()
          expect(user.email).toBe('userTestSubscription2@gmail.com')

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    await authenticatedClient.mutate({
      mutation: gql`
        mutation {
          user(email: "userTestSubscription2@gmail.com") {
            id
          }
        }
      `,
    })
  })

  it("userUpdated shouldn't work if not authenticated", (done) => {
    clientWithoutToken
      .subscribe({
        query: gql`
          subscription {
            userUpdated {
              id
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeDefined()
          expect(res.errors[0].message).toBe('No authorization token')
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })
  })

  it('deviceUpdated subscription should work', async (done) => {
    const subscription = authenticatedClient
      .subscribe({
        query: gql`
          subscription {
            deviceUpdated {
              id
              deviceType
              customName
              tags
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeUndefined()

          const device = res.data.deviceUpdated
          expect(device.id).toBe(deviceId)
          expect(device.deviceType).toBe('NewType')
          expect(device.customName).toBe('NewName')
          expect(device.tags).toEqual(['newTag'])

          subscription.unsubscribe()
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })

    await authenticatedClient.mutate({
      mutation: gql`
        mutation($deviceId: ID!) {
          device(
            id: $deviceId
            deviceType: "NewType"
            customName: "NewName"
            tags: ["newTag"]
          ) {
            id
          }
        }
      `,
      variables: {
        deviceId,
      },
    })
  })

  it("deviceUpdated shouldn't work if not authenticated", (done) => {
    clientWithoutToken
      .subscribe({
        query: gql`
          subscription {
            deviceUpdated {
              id
            }
          }
        `,
      })
      .subscribe({
        async next(res) {
          expect(res.errors).toBeDefined()
          expect(res.errors[0].message).toBe('No authorization token')
          done()
        },
        error(e) {
          throw new Error(`Subscription error ${e}`)
        },
      })
  })
})
