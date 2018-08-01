import { subscriptionFilterOnlyMine, socketToDeviceMap } from './utilities'

const subscriptionResolver = (pubsub, Device) => ({
  deviceCreated: subscriptionFilterOnlyMine('deviceCreated', pubsub),
  valueCreated: subscriptionFilterOnlyMine('valueCreated', pubsub),
  tokenCreated: subscriptionFilterOnlyMine('tokenCreated', pubsub),
  notificationCreated: subscriptionFilterOnlyMine(
    'notificationCreated',
    pubsub,
  ),
  userUpdated: subscriptionFilterOnlyMine('userUpdated', pubsub),
  deviceUpdated: subscriptionFilterOnlyMine('deviceUpdated', pubsub),
  valueUpdated: subscriptionFilterOnlyMine('valueUpdated', pubsub),
  notificationUpdated: subscriptionFilterOnlyMine(
    'notificationUpdated',
    pubsub,
  ),
  notificationDeleted: subscriptionFilterOnlyMine(
    'notificationDeleted',
    pubsub,
  ),
  valueDeleted: subscriptionFilterOnlyMine('valueDeleted', pubsub),
  deviceDeleted: subscriptionFilterOnlyMine('deviceDeleted', pubsub),
  tokenDeleted: subscriptionFilterOnlyMine('tokenDeleted', pubsub),
  keepOnline: {
    subscribe: async (root, args, context, info) => {
      if (context.auth) {
        // sets the online status of the passed device as true
        const deviceFound = await Device.find({
          where: { id: args.deviceId },
        })

        if (!deviceFound) {
          throw new Error("Device doesn't exist. Use `CreateDevice` to create one")
        } else if (deviceFound.userId !== context.auth.userId) {
          throw new Error('You are not allowed to access details about this resource')
        } else {
          const newDevice = await deviceFound.update({ online: true })
          pubsub.publish('deviceUpdated', {
            deviceUpdated: newDevice.dataValues,
            userId: context.auth.userId,
          })
        }

        socketToDeviceMap[context.websocket] = {
          deviceId: args.deviceId,
          userId: context.auth.userId,
        }

        return pubsub.asyncIterator('bogusIterator') // this iterator will never send any data
      }
      throw new Error('No authorization token')
    },
  },
})
export default subscriptionResolver
