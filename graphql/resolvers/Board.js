import {
  logErrorsPromise,
  authorizedScalarPropsResolvers,
  authorized,
  rolesResolver,
} from './utilities'

const QUERY_COST = 1

const BoardResolver = (Board, Device, Notification) => ({
  ...authorizedScalarPropsResolvers(Board, [
    'customName',
    'avatar',
    'createdAt',
    'updatedAt',
    'index',
    'favorite',
    'quietMode',
  ]),
  owner(root, args, context) {
    return logErrorsPromise(
      'user BoardResolver',
      902,
      authorized(
        root.id,
        context,
        Board,
        1,
        async (resolve, reject, boardFound) => {
          resolve({
            id: boardFound.ownerId,
          })

          context.billingUpdater.update(QUERY_COST)
        },
      ),
    )
  },
  admins: rolesResolver('adminsIds', Board),
  editors: rolesResolver('editorsIds', Board),
  spectators: rolesResolver('spectatorsIds', Board),
  devices(root, args, context) {
    return logErrorsPromise(
      'devices BoardResolver',
      903,
      authorized(
        root.id,
        context,
        Board,
        1,
        async (resolve, reject, boardFound) => {
          const devices = await Device.findAll({ where: { boardId: root.id } })

          resolve(devices)

          context.billingUpdater.update(QUERY_COST * devices.length)
        },
      ),
    )
  },
  notificationsCount(root, args, context) {
    return logErrorsPromise(
      'notificationsCount BoardResolver',
      915,
      authorized(
        root.id,
        context,
        Board,
        1,
        async (resolve, reject, boardFound) => {
          const devices = await Device.findAll({ where: { boardId: root.id } })

          const notificationsCountsPromises = devices.map(device =>
            Notification.count({ where: { deviceId: device.id } }))

          const notificationsCounts = await Promise.all(notificationsCountsPromises)
          const totalCount = notificationsCounts.reduce((a, b) => a + b, 0)

          resolve(totalCount)
          context.billingUpdater.update(QUERY_COST)
        },
      ),
    )
  },
})

export default BoardResolver
