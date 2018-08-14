import {
  authenticated,
  retrieveScalarProp,
  logErrorsPromise,
  scalarPropsResolvers,
} from './utilities'

const QUERY_COST = 1

const BoardResolver = (Board, Device, Notification) => ({
  ...scalarPropsResolvers(Board, [
    'customName',
    'avatar',
    'createdAt',
    'updatedAt',
    'index',
    'favorite',
    'quietMode',
  ]),
  user(root, args, context) {
    return logErrorsPromise(
      'user BoardResolver',
      902,
      authenticated(context, async (resolve, reject) => {
        const boardFound = await Board.find({ where: { id: root.id } })

        /* istanbul ignore if */
        if (!boardFound) {
          reject('The requested resource does not exist')
        } else if (boardFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          resolve({
            id: boardFound.userId,
          })

          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  devices(root, args, context) {
    return logErrorsPromise(
      'devices BoardResolver',
      903,
      authenticated(context, async (resolve, reject) => {
        const boardFound = await Board.find({ where: { id: root.id } })

        /* istanbul ignore if */
        if (!boardFound) {
          reject('The requested resource does not exist')
        } else if (boardFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          const devices = await Device.findAll({ where: { boardId: root.id } })

          resolve(devices)

          context.billingUpdater.update(QUERY_COST * devices.length)
        }
      }),
    )
  },
  notificationsCount(root, args, context) {
    return logErrorsPromise(
      'notificationsCount BoardResolver',
      915,
      authenticated(context, async (resolve, reject) => {
        const boardFound = await Board.find({ where: { id: root.id } })

        /* istanbul ignore if */
        if (!boardFound) {
          reject('The requested resource does not exist')
        } else if (boardFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          const devices = await Device.findAll({ where: { boardId: root.id } })

          const notificationsCountsPromises = devices.map(device =>
            Notification.count({ where: { deviceId: device.id } }))

          const notificationsCounts = await Promise.all(notificationsCountsPromises)
          // avoid reducing an empty array
          const totalCount =
            notificationsCounts.length === 0
              ? 0
              : notificationsCounts.reduce((a, b) => a + b, 0)

          resolve(totalCount)
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
})

export default BoardResolver
