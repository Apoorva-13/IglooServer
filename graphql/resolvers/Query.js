"use strict"
import { authenticated, logErrorsPromise } from './utilities.js'

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
          resolve({
            ...valueFound.dataValues.childFloat.dataValues, // childFloat first to use main Value id
            ...valueFound.dataValues,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'FloatValue',
          })
        } else if (valueFound.dataValues.childString) {
          resolve({
            ...valueFound.dataValues.childString.dataValues,
            ...valueFound.dataValues,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'StringValue',
          })
        } else if (valueFound.dataValues.childBool) {
          resolve({
            ...valueFound.dataValues.childBool.dataValues,
            ...valueFound.dataValues,
            user: {
              id: valueFound.dataValues.userId,
            },
            device: {
              id: valueFound.dataValues.deviceId,
            },
            __resolveType: 'BooleanValue',
          })
        } else {
          resolve({
            ...valueFound.dataValues.childColour.dataValues,
            ...valueFound.dataValues,
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
