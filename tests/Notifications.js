import request from 'supertest'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000 // ensures that tests don't fail due to slow connection

require('dotenv').config()

if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const self = {}
module.exports = (GraphQLServer) => {
  describe('Notification', () => {
    beforeAll(async () => {
      // creating 2 accounts to perform all the operations
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .send({
          query: `mutation SignupUser($email: String!, $password: String!) {
                                    SignupUser(email: $email, password: $password) {
                                        id
                                        token
                                    }
                                }
                            `,
          variables: {
            email: 'notificationTest1@email.com',
            password: 'password',
          },
        })
      const parsedRes = JSON.parse(res.text)
      self.userId1 = parsedRes.data.SignupUser.id
      self.token1 = parsedRes.data.SignupUser.token

      const res2 = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .send({
          query: `mutation SignupUser($email: String!, $password: String!) {
                                SignupUser(email: $email, password: $password) {
                                    id
                                    token
                                }
                            }
                        `,
          variables: {
            email: 'notificationTest2@email.com',
            password: 'password',
          },
        })
      const parsedRes2 = JSON.parse(res2.text)
      self.userId2 = parsedRes2.data.SignupUser.id
      self.token2 = parsedRes2.data.SignupUser.token

      const res3 = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation CreateDevice($deviceType: String!, $customName: String!){
                      CreateDevice(deviceType: $deviceType, customName: $customName){
                          id
                      }
                  }
                  `,
          variables: {
            deviceType: 'device',
            customName: 'testDevice',
          },
        })
      const parsedRes3 = JSON.parse(res3.text)
      self.deviceId1 = parsedRes3.data.CreateDevice.id

      const res4 = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token2}`)
        .send({
          query: `mutation CreateDevice($deviceType: String!, $customName: String!){
                      CreateDevice(deviceType: $deviceType, customName: $customName){
                          id
                      }
                  }
                  `,
          variables: {
            deviceType: 'device',
            customName: 'testDevice2',
          },
        })
      const parsedRes4 = JSON.parse(res4.text)
      self.deviceId2 = parsedRes4.data.CreateDevice.id
    })

    it('should be able to create a notification', async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($deviceId:ID!,$content:String!){
            CreateNotification(deviceId:$deviceId, content:$content){
                id
                content
                date
                visualized
                user{
                    id
                    email
                }
                device{
                    id
                    customName
                }
            }
          }
                  `,
          variables: {
            deviceId: self.deviceId1,
            content: 'Test notification 1',
          },
        })
      const parsedRes = JSON.parse(res.text)
      const {
        id,
        content,
        date,
        visualized,
        user,
        device,
      } = parsedRes.data.CreateNotification
      expect(parsedRes.errors).toBeUndefined()
      expect(id).toBeDefined()
      expect(content).toBe('Test notification 1')
      expect(date).toBeDefined()
      expect(visualized).toBe(false)
      expect(user.id).toBe(self.userId1)
      expect(user.email).toBe('notificationTest1@email.com')
      expect(device.id).toBe(self.deviceId1)
      expect(device.customName).toBe('testDevice')

      self.notificationId1 = id
      done()
    })

    it('should not be able to create a notification without a token', async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .send({
          query: `mutation($deviceId:ID!,$content:String!){
            CreateNotification(deviceId:$deviceId, content:$content){
                id
                content
                date
                visualized
                user{
                    id
                    email
                }
                device{
                    id
                    customName
                }
            }
          }
                  `,
          variables: {
            deviceId: self.deviceId1,
            content: 'Test notification 1',
          },
        })
      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      done()
    })

    it("should not be able to create a notification if the device doesn't exist", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($deviceId:ID!,$content:String!){
            CreateNotification(deviceId:$deviceId, content:$content){
                id
                content
                date
                visualized
                user{
                    id
                    email
                }
                device{
                    id
                    customName
                }
            }
          }
                  `,
          variables: {
            deviceId: 'aaf5480f-b804-424d-bec8-3f7b363b5519', // wrong ID
            content: 'Test notification 1',
          },
        })
      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe("Device doesn't exist. Use `CreateDevice` to create one")
      done()
    })

    it("should not be able to create a notification if the device's owner is someone else", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($deviceId:ID!,$content:String!){
            CreateNotification(deviceId:$deviceId, content:$content){
                id
                content
                date
                visualized
                user{
                    id
                    email
                }
                device{
                    id
                    customName
                }
            }
          }
                  `,
          variables: {
            deviceId: self.deviceId2,
            content: 'Test notification 1',
          },
        })
      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not allowed to access details about this resource')
      done()
    })

    it("should be able to fetch user's notifications", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `{
          user{
              notifications{
                  id
              }
          }
      }
                `,
        })

      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeUndefined()
      expect(parsedRes.data.user.notifications[0].id).toBe(self.notificationId1)
      done()
    })

    it("should be able to fetch device's notifications", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `query($id:ID!){
          device(id:$id){
              notifications{
                  id
              }
          }
      }
                `,
          variables: {
            id: self.deviceId1,
          },
        })

      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeUndefined()
      expect(parsedRes.data.device.notifications[0].id).toBe(self.notificationId1)
      done()
    })

    it("should not be able to fetch someone else's device notifications", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `query($id:ID!){
          device(id:$id){
              notifications{
                  id
              }
          }
      }
                `,
          variables: {
            id: self.deviceId2,
          },
        })

      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not allowed to access details about this resource')
      done()
    })

    it('should be able to mutate a notification', async (done) => {
      const now = new Date()

      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($id:ID!,$content:String!,$date:DateTime!,$visualized:Boolean!){
          notification(id:$id,content:$content,date:$date,visualized:$visualized){
              id
              content
              date
              visualized
          }
      }
                `,
          variables: {
            id: self.notificationId1,
            visualized: true,
            content: 'Edited content 1',
            date: now,
          },
        })

      const parsedRes = JSON.parse(res.text)
      const {
        id, content, date, visualized,
      } = parsedRes.data.notification

      expect(id).toBe(self.notificationId1)
      expect(visualized).toBe(true)
      expect(content).toBe('Edited content 1')
      expect(date).toBe(now.toISOString())
      done()
    })

    it("should not be able to mutate someone else's notification", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token2}`)
        .send({
          query: `mutation($deviceId:ID!,$content:String!){
          CreateNotification(deviceId:$deviceId, content:$content){
              id
          }
        }
                `,
          variables: {
            deviceId: self.deviceId2,
            content: 'Test notification 2',
          },
        })
      const parsedRes = JSON.parse(res.text)
      const { id } = parsedRes.data.CreateNotification
      self.notificationId2 = id

      const now = new Date()

      const res2 = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($id:ID!,$content:String!,$date:DateTime!,$visualized:Boolean!){
          notification(id:$id,content:$content,date:$date,visualized:$visualized){
              id
              content
              date
              visualized
          }
      }
                `,
          variables: {
            id: self.notificationId2,
            visualized: true,
            content: 'Edited content 1',
            date: now,
          },
        })

      const parsedRes2 = JSON.parse(res2.text)
      expect(parsedRes2.errors).toBeDefined()
      expect(parsedRes2.errors[0].message).toBe('You are not allowed to update this resource')
      done()
    })

    it('should not be able to mutate a notification while unauthenticated', async (done) => {
      const now = new Date()

      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .send({
          query: `mutation($id:ID!,$content:String!,$date:DateTime!,$visualized:Boolean!){
          notification(id:$id,content:$content,date:$date,visualized:$visualized){
              id
              content
              date
              visualized
          }
      }
                `,
          variables: {
            id: self.notificationId2,
            visualized: true,
            content: 'Edited content 1',
            date: now,
          },
        })

      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      done()
    })

    it("should not be able to mutate a notification that doesn't exist", async (done) => {
      const now = new Date()

      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token2}`)
        .send({
          query: `mutation($id:ID!,$content:String!,$date:DateTime!,$visualized:Boolean!){
          notification(id:$id,content:$content,date:$date,visualized:$visualized){
              id
              content
              date
              visualized
          }
      }
                `,
          variables: {
            id: 'aaf5480f-b804-424d-bec8-3f7b363b5519', // wrong ID
            visualized: true,
            content: 'Edited content 1',
            date: now,
          },
        })

      const parsedRes = JSON.parse(res.text)
      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('The requested resource does not exist')
      done()
    })

    it('should be able to delete a notification', async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($id:ID!){
            deleteNotification(id:$id)
        }
              `,
          variables: {
            id: self.notificationId1,
          },
        })

      const parsedRes = JSON.parse(res.text)

      expect(parsedRes.errors).toBeUndefined()
      expect(parsedRes.data.deleteNotification).toBe(self.notificationId1)

      const res2 = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `{
        user{
            notifications{
                id
            }
        }
    }
              `,
        })

      const parsedRes2 = JSON.parse(res2.text)
      expect(parsedRes2.errors).toBeUndefined()
      expect(parsedRes2.data.user.notifications.length).toBe(0)

      done()
    })
    it('should not be able to delete a notification while unauthenticated', async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .send({
          query: `mutation($id:ID!){
            deleteNotification(id:$id)
        }
              `,
          variables: {
            id: self.notificationId2,
          },
        })

      const parsedRes = JSON.parse(res.text)

      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      done()
    })
    it('should not be able to delete someone else notification', async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($id:ID!){
            deleteNotification(id:$id)
        }
              `,
          variables: {
            id: self.notificationId2,
          },
        })

      const parsedRes = JSON.parse(res.text)

      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('You are not allowed to update this resource')
      done()
    })

    it("should not be able to delete a notification that doesn't exist", async (done) => {
      const res = await request(GraphQLServer)
        .post('/graphql')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('Authorization', `Bearer ${self.token1}`)
        .send({
          query: `mutation($id:ID!){
            deleteNotification(id:$id)
        }
              `,
          variables: {
            id: 'aaf5480f-b804-424d-bec8-3f7b363b5519', // wrong ID
          },
        })

      const parsedRes = JSON.parse(res.text)

      expect(parsedRes.errors).toBeDefined()
      expect(parsedRes.errors[0].message).toBe('The requested resource does not exist')
      done()
    })
  })
}
