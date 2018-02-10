import {
  authenticated,
  retrieveScalarProp,
  logErrorsPromise,
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
          const values = await Value.findAll({
            where: { deviceId: deviceFound.id },
            include: [
              {
                model: FloatValue,
                required: false,
                as: 'childFloat',
              },
              {
                model: StringValue,
                required: false,
                as: 'childString',
              },
              {
                model: BoolValue,
                required: false,
                as: 'childBool',
              },
              {
                model: ColourValue,
                required: false,
                as: 'childColour',
              },
            ],
          })
          resolve(values.map((value) => {
            if (value.dataValues.childFloat) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const floatValueDate = +new Date(value.dataValues.childFloat.dataValues.updatedAt)
              return {
                ...value.dataValues.childFloat.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > floatValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childFloat.dataValues.updatedAt,
                __resolveType: 'FloatValue',
              }
            } else if (value.dataValues.childString) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const stringValueDate = +new Date(value.dataValues.childString.dataValues.updatedAt)

              return {
                ...value.dataValues.childString.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > stringValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childString.dataValues.updatedAt,
                __resolveType: 'StringValue',
              }
            } else if (value.dataValues.childBool) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const boolValueDate = +new Date(value.dataValues.childBool.dataValues.updatedAt)

              return {
                ...value.dataValues.childBool.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > boolValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childBool.dataValues.updatedAt,
                __resolveType: 'BooleanValue',
              }
            }
            const valueDate = +new Date(value.dataValues.updatedAt)
            const colourValueDate = +new Date(value.dataValues.childColour.dataValues.updatedAt)

            return {
              ...value.dataValues.childColour.dataValues,
              ...value.dataValues,
              updatedAt:
                  valueDate > colourValueDate
                    ? value.dataValues.updatedAt
                    : value.dataValues.childColour.dataValues.updatedAt,
              __resolveType: 'ColourValue',
            }
          }))
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
