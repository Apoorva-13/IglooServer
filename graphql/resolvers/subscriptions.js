import {
  subscriptionFilterOnlyMine,
  subscriptionFilterOwnedOrShared,
  socketToDeviceMap,
  authorized,
  deviceToParents,
  logErrorsPromise,
  instancesToSharedIds,
} from './utilities'

const subscriptionResolver = (pubsub, Device, Board) => ({
  boardCreated: subscriptionFilterOnlyMine('boardCreated', pubsub),
  deviceCreated: subscriptionFilterOwnedOrShared('deviceCreated', pubsub),
  valueCreated: subscriptionFilterOwnedOrShared('valueCreated', pubsub),
  tokenCreated: subscriptionFilterOnlyMine('tokenCreated', pubsub),
  plotNodeCreated: subscriptionFilterOnlyMine('plotNodeCreated', pubsub),
  stringPlotNodeCreated: subscriptionFilterOnlyMine(
    'stringPlotNodeCreated',
    pubsub,
  ),
  notificationCreated: subscriptionFilterOwnedOrShared(
    'notificationCreated',
    pubsub,
  ),
  userUpdated: subscriptionFilterOnlyMine('userUpdated', pubsub),
  deviceUpdated: subscriptionFilterOwnedOrShared('deviceUpdated', pubsub),
  boardUpdated: subscriptionFilterOwnedOrShared('boardUpdated', pubsub),
  valueUpdated: subscriptionFilterOwnedOrShared('valueUpdated', pubsub),
  plotNodeUpdated: subscriptionFilterOnlyMine('plotNodeUpdated', pubsub),
  stringPlotNodeUpdated: subscriptionFilterOnlyMine(
    'stringPlotNodeUpdated',
    pubsub,
  ),
  notificationUpdated: subscriptionFilterOwnedOrShared(
    'notificationUpdated',
    pubsub,
  ),
  notificationDeleted: subscriptionFilterOwnedOrShared(
    'notificationDeleted',
    pubsub,
  ),
  valueDeleted: subscriptionFilterOwnedOrShared('valueDeleted', pubsub),
  deviceDeleted: subscriptionFilterOwnedOrShared('deviceDeleted', pubsub),
  boardDeleted: subscriptionFilterOwnedOrShared('boardDeleted', pubsub),
  plotNodeDeleted: subscriptionFilterOnlyMine('plotNodeDeleted', pubsub),
  stringPlotNodeDeleted: subscriptionFilterOnlyMine(
    'stringPlotNodeDeleted',
    pubsub,
  ),
  tokenDeleted: subscriptionFilterOnlyMine('tokenDeleted', pubsub),
  keepOnline: {
    subscribe: (root, args, context) =>
      logErrorsPromise(
        'keepOnlineSubscription',
        1000,
        authorized(
          args.deviceId,
          context,
          Device,
          2,
          async (resolve, reject, deviceFound, deviceAndBoard) => {
            const newDevice = await deviceFound.update({ online: true })
            const userIds = instancesToSharedIds(deviceAndBoard)

            pubsub.publish('deviceUpdated', {
              deviceUpdated: newDevice.dataValues,
              userIds,
            })

            socketToDeviceMap[context.websocket] = {
              deviceId: args.deviceId,
              userIds,
            }

            resolve(pubsub.asyncIterator('bogusIterator')) // this iterator will never send any data
          },
          deviceToParents(Board),
        ),
      ),
  },
})
export default subscriptionResolver
