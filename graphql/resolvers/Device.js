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
) => ({
  createdAt: retrieveScalarProp(Device, 'createdAt'),
  updatedAt: retrieveScalarProp(Device, 'updatedAt'),
  deviceType: retrieveScalarProp(Device, 'deviceType'),
  customName: retrieveScalarProp(Device, 'customName'),
  tags: retrieveScalarProp(Device, 'tags'),
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
              return {
                ...value.dataValues.childFloat.dataValues,
                ...value.dataValues,
                __resolveType: 'FloatValue',
              }
            } else if (value.dataValues.childString) {
              return {
                ...value.dataValues.childString.dataValues,
                ...value.dataValues,
                __resolveType: 'StringValue',
              }
            } else if (value.dataValues.childBool) {
              return {
                ...value.dataValues.childBool.dataValues,
                ...value.dataValues,
                __resolveType: 'BooleanValue',
              }
            }
            return {
              ...value.dataValues.childColour.dataValues,
              ...value.dataValues,
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
})

export default DeviceResolver
