import { authenticated, logErrorsPromise } from './utilities'

const QueryResolver = (
  Device,
  Value,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
) => ({
  user(root, args, context) {
    return new Promise(authenticated(context, (resolve) => {
      resolve({ id: context.auth.userId })
    }))
  },
  device(root, args, context) {
    return logErrorsPromise(
      'device query',
      105,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: args.id },
        })
        if (!deviceFound) {
          reject('The requested resource does not exist')
        } else if (deviceFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else {
          const {
            id,
            updatedAt,
            createdAt,
            customName,
            tags,
            deviceType,
            userId,
          } = deviceFound
          resolve({
            id,
            updatedAt,
            createdAt,
            customName,
            tags,
            deviceType,
            user: {
              id: userId,
            },
          })
        }
      }),
    )
  },
  value(root, args, context) {
    return logErrorsPromise(
      'values query',
      114,
      authenticated(context, async (resolve, reject) => {
        const valueFound = await Value.find({
          where: { id: args.id },
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
        if (!valueFound) {
          reject('The requested resource does not exist')
        } else if (valueFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else if (valueFound.dataValues.childFloat) {
          const valueDate = +new Date(valueFound.dataValues.updatedAt)
          const floatValueDate = +new Date(valueFound.dataValues.childFloat.dataValues.updatedAt)

          resolve({
            ...valueFound.dataValues.childFloat.dataValues, // childFloat first to use main Value id
            ...valueFound.dataValues,
            updatedAt:
              valueDate > floatValueDate
                ? valueFound.dataValues.updatedAt
                : valueFound.dataValues.childFloat.dataValues.updatedAt,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'FloatValue',
          })
        } else if (valueFound.dataValues.childString) {
          const valueDate = +new Date(valueFound.dataValues.updatedAt)
          const stringValueDate = +new Date(valueFound.dataValues.childString.dataValues.updatedAt)

          resolve({
            ...valueFound.dataValues.childString.dataValues,
            ...valueFound.dataValues,
            updatedAt:
              valueDate > stringValueDate
                ? valueFound.dataValues.updatedAt
                : valueFound.dataValues.childString.dataValues.updatedAt,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'StringValue',
          })
        } else if (valueFound.dataValues.childBool) {
          const valueDate = +new Date(valueFound.dataValues.updatedAt)
          const boolValueDate = +new Date(valueFound.dataValues.childBool.dataValues.updatedAt)

          resolve({
            ...valueFound.dataValues.childBool.dataValues,
            ...valueFound.dataValues,
            updatedAt:
              valueDate > boolValueDate
                ? valueFound.dataValues.updatedAt
                : valueFound.dataValues.childBool.dataValues.updatedAt,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'BooleanValue',
          })
        } else {
          const valueDate = +new Date(valueFound.dataValues.updatedAt)
          const colourValueDate = +new Date(valueFound.dataValues.childColour.dataValues.updatedAt)

          resolve({
            ...valueFound.dataValues.childColour.dataValues,
            ...valueFound.dataValues,
            updatedAt:
              valueDate > colourValueDate
                ? valueFound.dataValues.updatedAt
                : valueFound.dataValues.childColour.dataValues.updatedAt,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'ColourValue',
          })
        }
      }),
    )
  },
})

export default QueryResolver
