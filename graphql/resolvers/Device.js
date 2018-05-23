import {
  authenticated,
  retrieveScalarProp,
  logErrorsPromise,
  findAllValues,
} from './utilities'

const DeviceResolver = (
  Device,
  User,
  Value,
  BoolValue,
  FloatValue,
  StringValue,
  PlotValue,
  PlotNode,
  MapValue,
  ColourValue,
  Notification,
) => ({
  createdAt: retrieveScalarProp(Device, 'createdAt'),
  updatedAt: retrieveScalarProp(Device, 'updatedAt'),
  deviceType: retrieveScalarProp(Device, 'deviceType'),
  customName: retrieveScalarProp(Device, 'customName'),
  tags: retrieveScalarProp(Device, 'tags'),
  icon: retrieveScalarProp(Device, 'icon'),
  index: retrieveScalarProp(Device, 'index'),
  online: retrieveScalarProp(Device, 'online'),
  values(root, args, context) {
    return logErrorsPromise(
      'Device values resolver',
      110,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!deviceFound) {
          reject('The requested resource does not exist')
        } else if (deviceFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          resolve(findAllValues(
            {
              BoolValue,
              FloatValue,
              StringValue,
              ColourValue,
              PlotValue,
              MapValue,
            },
            {
              where: { deviceId: deviceFound.id },
            },
            context.auth.userId,
          ))
        }
      }),
    )
  },
  user(root, args, context) {
    return logErrorsPromise(
      'Device user resolver',
      111,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!deviceFound) {
          reject('The requested resource does not exist')
        } else if (deviceFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the user id
          resolve({ id: deviceFound.userId })
        }
      }),
    )
  },

  notifications(root, args, context) {
    return logErrorsPromise(
      'User devices resolver',
      119,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!deviceFound) {
          reject('The requested resource does not exist')
        } else if (deviceFound.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          const notifications = await Notification.findAll({
            where: { deviceId: root.id },
          })

          resolve(notifications)
        }
      }),
    )
  },
})

export default DeviceResolver
