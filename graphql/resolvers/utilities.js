import jwt from 'jwt-simple'
import moment from 'moment'
import chalk from 'chalk'
import OTP from 'otp.js'
import fortuna from 'javascript-fortuna'
import { withFilter } from 'graphql-subscriptions'
import winston from 'winston'
import WinstonSlacker from 'winston-slacker'

require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const { combine, timestamp, printf } = winston.format

const formatString = info =>
  `${info.timestamp} [${info.label ? info.label : 'generic'}${chalk.bold(info.code ? ` ${info.code}` : '')}] ${info.level}: ${info.message}`

const colorizedFormat = printf((info) => {
  /* istanbul ignore next */
  const colorizer =
    info.level === 'error'
      ? chalk.red
      : info.level === 'warn'
        ? chalk.yellow
        : info.level === 'info' ? chalk.blue : id => id

  return colorizer(formatString(info))
})
const logger = winston.createLogger({
  level: 'verbose',
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), colorizedFormat),
    }),
    new winston.transports.File({
      filename: 'logs.log',
      format: combine(timestamp(), printf(formatString)), // do not colorize file logs
    }),
    ...(process.env.NODE_ENV === 'production'
      ? [
        new WinstonSlacker({
          webhook: process.env.SLACK_WEBHOOK,
          channel: '#alerts',
          username: 'Production Alert',
          icon_emoji: ':scream:',
          level: 'warn',
        }),
      ]
      : []),
  ],
})

const GA = OTP.googleAuthenticator
const JWT_EXPIRE_DAYS = 7

fortuna.init()

const authenticated = (context, callback) =>
  (context.auth
    ? callback
    : (resolve, reject) =>
      reject('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token'))

const generateAuthenticationToken = (userId, JWT_SECRET) =>
  jwt.encode(
    {
      exp: moment()
        .utc()
        .add({ days: JWT_EXPIRE_DAYS })
        .unix(),
      userId,
    },
    JWT_SECRET,
    'HS512',
  )

const retrieveScalarProp = (Model, prop) => (root, args, context) =>
  new Promise(authenticated(context, async (resolve, reject) => {
    try {
      const resourceFound = await Model.find({
        where: { id: root.id },
      })
      /* istanbul ignore next */
      if (!resourceFound) {
        reject('The requested resource does not exist')
      } else if (resourceFound.userId !== context.auth.userId) {
        /* istanbul ignore next */
        reject('You are not allowed to access details about this resource')
      } else {
        resolve(resourceFound[prop])
      }
    } catch (e) /* istanbul ignore next */ {
      logger.error(e, { label: 'retrieveScalarProp', code: 109 })
      reject('109 - An internal error occured, please contact us. The error code is 109')
    }
  }))

const getPropsIfDefined = (args, props) => {
  const propObject = {}
  for (let i = 0; i < props.length; i += 1) {
    if (args[props[i]] !== undefined && args[props[i]] !== null) {
      propObject[props[i]] = args[props[i]]
    }
  }

  return propObject
}

// generic resolver for CreateXValue mutations
const CreateGenericValue = (
  Device,
  Value,
  childProps,
  childName,
  childModel,
  pubsub,
) => (root, args, context) =>
  new Promise(authenticated(context, async (resolve, reject) => {
    // looks for the device, if the device is owned by the user
    // creates a Value in the database and returns
    try {
      const deviceFound = await Device.find({
        where: { id: args.deviceId },
      })
      if (!deviceFound) {
        reject('The supplied deviceId does not exist')
      } else if (deviceFound.userId !== context.auth.userId) {
        reject('You are not allowed to edit details about this device')
      } else {
        const {
          deviceId,
          valueDetails,
          permission,
          relevance,
          value,
          tileSize,
          customName,
        } = args

        const childGeneric = getPropsIfDefined(args, childProps)

        // creates the value and the associated FloatValue/StringValue/...
        const newValue = await Value.create(
          {
            userId: context.auth.userId,
            deviceId,
            valueDetails,
            permission,
            relevance,
            tileSize: tileSize || 'NORMAL',
            customName,
            [childName]: {
              userId: context.auth.userId,
              value,
              ...childGeneric,
            },
          },
          {
            include: [
              {
                model: childModel,
                as: childName,
              },
            ],
          },
        )

        const resolveObj = {
          id: newValue.id,
          createdAt: newValue[childName].createdAt,
          updatedAt: newValue[childName].updatedAt,
          device: {
            id: newValue.deviceId,
          },
          user: {
            id: newValue.userId,
          },
          permission: newValue.permission,
          relevance: newValue.relevance,
          valueDetails: newValue.valueDetails,
          value: newValue[childName].value,
          tileSize: newValue.tileSize,
          customName: newValue.customName,
          __resolveType:
              childName === 'childFloat'
                ? 'FloatValue'
                : childName === 'childString'
                  ? 'StringValue'
                  : childName === 'childBool' ? 'BooleanValue' : 'ColourValue',
        }
        // loads in resolveObj all the required props from args
        for (let i = 0; i < childProps.length; i += 1) {
          resolveObj[childProps[i]] = newValue[childName][childProps[i]]
        }

        pubsub.publish('valueCreated', {
          valueCreated: resolveObj,
          userId: context.auth.userId,
        })

        resolve(resolveObj)
      }
    } catch (e) /* istanbul ignore next */ {
      logger.error(e, { label: 'CreateGenericValue', code: 112 })
      reject('112 - An internal error occured, please contact us. The error code is 112')
    }
  }))

const logErrorsPromise = (name, code, callback) =>
  new Promise(async (resolve, reject) => {
    try {
      await callback(resolve, reject)
    } catch (e) /* istanbul ignore next */ {
      if (e.parent.routine === 'string_to_uuid') {
        reject(new Error('The ID you provided is not a valid ID, check for typing mistakes'))
      } else {
        logger.error(JSON.stringify(e, null, 2), { label: name, code })
        reject(new Error(`${code} - An internal error occured, please contact us. The error code is ${code}`))
      }
    }
  })

const genericValueMutation = (
  Value,
  childProps,
  childNameId,
  childModel,
  __resolveType,
  pubsub,
) => (root, args, context) =>
  logErrorsPromise(
    'genericValue mutation',
    117,
    authenticated(context, async (resolve, reject) => {
      const valueFound = await Value.find({ where: { id: args.id } })
      if (!valueFound) {
        reject('The requested resource does not exist')
      } else if (valueFound.userId !== context.auth.userId) {
        reject('You are not allowed to update this resource')
      } else if (!valueFound[childNameId]) {
        reject('This Value has the wrong type, please use the correct mutation')
      } else {
        const valueUpdate = getPropsIfDefined(args, [
          'permission',
          'relevance',
          'valueDetails',
          'tileSize',
          'customName',
        ])
        const newValue =
          Object.keys(valueUpdate).length === 0
            ? valueFound
            : await valueFound.update(valueUpdate)

        const childValueFound = await childModel.find({
          where: { id: valueFound[childNameId] },
        })
        const childValueUpdate = getPropsIfDefined(args, [
          'value',
          ...childProps,
        ])
        const newChildValue =
          Object.keys(childValueUpdate).length === 0
            ? childValueFound
            : await childValueFound.update(childValueUpdate)

        const resolveObj = {
          ...newChildValue.dataValues,
          ...newValue.dataValues,
          user: { id: newChildValue.dataValues.userId },
          device: { id: newValue.dataValues.deviceId },
        }
        resolve(resolveObj)

        pubsub.publish('valueUpdated', {
          valueUpdated: { ...resolveObj, __resolveType },
          userId: context.auth.userId,
        })
      }
    }),
  )

const create2FSecret = (user) => {
  const allowedChars = 'QWERTYUIOPASDFGHJKLZXCVBNM234567'
  let secret = ''
  for (let i = 0; i < 12; i += 1) {
    const randomNumber = Math.floor(fortuna.random() * allowedChars.length)
    secret += allowedChars[randomNumber]
  }
  secret = GA.encode(secret)
  return { secret, qrCode: GA.qrCode(user, 'igloo', secret) }
}
const check2FCode = (code, secret) => {
  try {
    const { delta } = GA.verify(code, secret)
    return Math.abs(delta) < 3
  } catch (e) {
    return false
  }
}

const subscriptionFilterOnlyMine = (subscriptionName, pubsub) => ({
  subscribe: (root, args, context, info) => {
    if (context.auth) {
      const myUserId = context.auth.userId
      return withFilter(
        () => pubsub.asyncIterator(subscriptionName),
        payload => payload.userId === myUserId,
      )(root, args, context, info)
    }
    throw new Error('No authorization token')
  },
})

module.exports = {
  authenticated,
  generateAuthenticationToken,
  retrieveScalarProp,
  CreateGenericValue,
  getPropsIfDefined,
  genericValueMutation,
  create2FSecret,
  check2FCode,
  logErrorsPromise,
  subscriptionFilterOnlyMine,
  logger,
}
