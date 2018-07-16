import {
  authenticated,
  retrieveScalarProp,
  logErrorsPromise,
} from './utilities'

const QUERY_COST = 1

const UserResolver = (Notification, User, Device) => ({
  content: retrieveScalarProp(Notification, 'content'),
  date: retrieveScalarProp(Notification, 'date'),
  visualized: retrieveScalarProp(Notification, 'visualized'),
  snackbarVisualized: retrieveScalarProp(Notification, 'snackbarVisualized'),
  user(root, args, context) {
    return logErrorsPromise(
      'Notification user resolver',
      120,
      authenticated(context, async (resolve, reject) => {
        const notificationFound = await Notification.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!notificationFound) {
          reject('The requested resource does not exist')
        } else if (notificationFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the user id
          resolve({ id: notificationFound.userId })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      'Notification device resolver',
      121,
      authenticated(context, async (resolve, reject) => {
        const notificationFound = await Notification.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!notificationFound) {
          reject('The requested resource does not exist')
        } else if (notificationFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the device id
          resolve({ id: notificationFound.deviceId })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
})

export default UserResolver
