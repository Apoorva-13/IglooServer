import jwt from 'jwt-simple'
import moment from 'moment'
import chalk from 'chalk'
import OTP from 'otp.js'
import fortuna from 'javascript-fortuna'
import { withFilter } from 'graphql-subscriptions'
import winston from 'winston'
import AWS from 'aws-sdk'

require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const ses = new AWS.SES({ region: 'eu-west-1' })

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
  ],
})

const GA = OTP.googleAuthenticator
const JWT_EXPIRE_DAYS = 7

fortuna.init()

const authenticated = (
  context,
  callback,
  acceptedTokenTypes = ['TEMPORARY', 'PERMANENT'],
) =>
  (context.auth && acceptedTokenTypes.indexOf(context.auth.tokenType) > -1
    ? callback
    : (resolve, reject) => {
      if (!context.auth) {
        reject('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      } else if (context.auth.tokenType === 'SWITCH_TO_PAYING') {
        reject('You exceeded the free usage quota')
      } else if (context.auth.tokenType === 'CHANGE_USAGE_CAP') {
        reject('You exceeded the usage cap that you set')
      } else reject("This token doesn't have the required authorizations")
    })

const generateAuthenticationToken = (userId, JWT_SECRET) =>
  jwt.encode(
    {
      exp: moment()
        .utc()
        .add({ days: JWT_EXPIRE_DAYS })
        .unix(),
      userId,
      accessLevel: 'OWNER',
      tokenType: 'TEMPORARY',
    },
    JWT_SECRET,
    'HS512',
  )

const generatePermanentAuthenticationToken = (
  userId,
  tokenId,
  accessLevel,
  JWT_SECRET,
) =>
  jwt.encode(
    {
      userId,
      tokenId,
      accessLevel: accessLevel || 'DEVICE',
      tokenType: 'PERMANENT',
    },
    JWT_SECRET,
    'HS512',
  )

const generatePasswordRecoveryToken = (userId, JWT_SECRET) =>
  jwt.encode(
    {
      exp: moment()
        .utc()
        .add({ hours: 1 })
        .unix(),
      userId,
      accessLevel: 'OWNER',
      tokenType: 'PASSWORD_RECOVERY',
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

const MUTATION_COST = 2
// generic resolver for CreateXValue mutations
const CreateGenericValue = (Device, Model, pubsub) => (root, args, context) =>
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
        const newValue = (await Model.create({
          ...args,
          tileSize: args.tileSize || 'NORMAL',
          userId: context.auth.userId,
        })).dataValues

        const resolveObj = {
          ...newValue,
          user: {
            id: newValue.userId,
          },
          device: {
            id: newValue.deviceId,
          },
        }

        pubsub.publish('valueCreated', {
          valueCreated: resolveObj,
          userId: context.auth.userId,
        })

        resolve(resolveObj)
        context.billingUpdater.update(MUTATION_COST)
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
      if (e.parent && e.parent.routine === 'string_to_uuid') {
        reject(new Error('The ID you provided is not a valid ID, check for typing mistakes'))
      } else {
        logger.error(e.toString(), { label: name, code })
        reject(new Error(`${code} - An internal error occured, please contact us. The error code is ${code}`))
      }
    }
  })

const genericValueMutation = (childModel, __resolveType, pubsub) => (
  root,
  args,
  context,
) =>
  logErrorsPromise(
    'genericValue mutation',
    117,
    authenticated(context, async (resolve, reject) => {
      const valueFound = await childModel.find({ where: { id: args.id } })
      if (!valueFound) {
        reject('The requested resource does not exist')
      } else if (valueFound.userId !== context.auth.userId) {
        reject('You are not allowed to update this resource')
      } else {
        const newValue = await valueFound.update(args)
        const resolveObj = {
          ...newValue.dataValues,
          user: {
            id: newValue.dataValues.userId,
          },
          device: {
            id: newValue.dataValues.deviceId,
          },
        }
        resolve(resolveObj)

        pubsub.publish('valueUpdated', {
          valueUpdated: { ...resolveObj, __resolveType },
          userId: context.auth.userId,
        })
        context.billingUpdater.update(MUTATION_COST)
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

// races promises returning the first resolve or all the rejects if none resolves
const firstResolve = promises =>
  new Promise((resolve, reject) => {
    const errors = []
    let count = 0
    let resolved = false
    promises.forEach((promise, idx) => {
      promise
        .then((found) => {
          if (!resolved) {
            resolved = true
            resolve(found)
          }
        })
        /* istanbul ignore next */

        .catch((err) => {
          errors[idx] = err
          count += 1
          if (count === promises.length) {
            reject(errors)
          }
        })
    })
  })

const findAllValues = (
  {
    BoolValue,
    FloatValue,
    StringValue,
    ColourValue,
    PlotValue,
    StringPlotValue,
    MapValue,
  },
  query,
  userId,
) => {
  const booleanValues = BoolValue.findAll(query)
  const floatValues = FloatValue.findAll(query)
  const stringValues = StringValue.findAll(query)
  const colourValues = ColourValue.findAll(query)
  const plotValues = PlotValue.findAll(query)
  const stringPlotValues = StringPlotValue.findAll(query)
  const mapValues = MapValue.findAll(query)

  return Promise.all([
    booleanValues,
    floatValues,
    stringValues,
    colourValues,
    plotValues,
    stringPlotValues,
    mapValues,
  ]).then(([
    booleanValues,
    floatValues,
    stringValues,
    colourValues,
    plotValues,
    stringPlotValues,
    mapValues,
  ]) => [
    ...booleanValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'BooleanValue',
      }))
      .filter(value => value.userId === userId),
    ...floatValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'FloatValue',
      }))
      .filter(value => value.userId === userId),
    ...stringValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'StringValue',
      }))
      .filter(value => value.userId === userId),
    ...colourValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'ColourValue',
      }))
      .filter(value => value.userId === userId),
    ...plotValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'PlotValue',
      }))
      .filter(value => value.userId === userId),
    ...stringPlotValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'StringPlotValue',
      }))
      .filter(value => value.userId === userId),
    ...mapValues
      .map(value => ({
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'MapValue',
      }))
      .filter(value => value.userId === userId),
  ])
}

// try refactoring this with firstResolve
const findValue = (
  {
    BoolValue,
    FloatValue,
    StringValue,
    ColourValue,
    PlotValue,
    StringPlotValue,
    MapValue,
  },
  query,
  userId,
) => {
  const booleanValue = BoolValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'BooleanValue',
      }
      : value))
  const floatValue = FloatValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'FloatValue',
      }
      : value))
  const stringValue = StringValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'StringValue',
      }
      : value))
  const colourValue = ColourValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'ColourValue',
      }
      : value))

  const mapValue = MapValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'MapValue',
      }
      : value))

  const plotValue = PlotValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'PlotValue',
      }
      : value))

  const stringPlotValue = StringPlotValue.find(query).then(value =>
    (value
      ? {
        ...value.dataValues,
        user: { id: value.dataValues.userId },
        device: { id: value.dataValues.deviceId },
        __resolveType: 'StringPlotValue',
      }
      : value))

  return Promise.all([
    booleanValue,
    floatValue,
    stringValue,
    colourValue,
    mapValue,
    plotValue,
  ])
    .then(values => values.reduce((acc, val) => val || acc, null))
    .then((value) => {
      if (!value) throw new Error('The requested resource does not exist')
      else if (value.userId !== userId) {
        throw new Error('You are not allowed to access details about this resource')
      } else return value
    })
}

const genericDelete = (Model, subscriptionName, pubsub) => (
  root,
  args,
  context,
) =>
  logErrorsPromise(
    'delete mutation',
    124,
    authenticated(context, async (resolve, reject) => {
      const entityFound = await Model.find({
        where: { id: args.id },
      })

      if (!entityFound) {
        reject('The requested resource does not exist')
      } else if (entityFound.userId !== context.auth.userId) {
        reject('You are not allowed to update this resource')
      } else {
        await entityFound.destroy()

        pubsub.publish(subscriptionName, {
          [subscriptionName]: args.id,
          userId: context.auth.userId,
        })
        resolve(args.id)
      }
    }),
  )

const socketToDeviceMap = {}

const sendVerificationEmail = (email, userId) => {
  // TODO: use different jwt secrets?
  const verificationToken = jwt.encode(
    {
      userId,
      email,
      tokenType: 'EMAIL_VERIFICATION',
    },
    process.env.JWT_SECRET,
    'HS512',
  )

  const GRAPHQL_PORT = process.env.PORT || 3000
  const serverLink =
    process.env.NODE_ENV === 'production'
      ? 'https://iglooql.herokuapp.com/verifyEmail/'
      : `http://localhost:${GRAPHQL_PORT}/verifyEmail/`
  const emailVerificationLink = serverLink + verificationToken

  // TODO: create a template for the email verification
  ses.sendEmail(
    {
      Source: "'Igloo Cloud' <verification@igloo.ooo>",
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `Verify your account clicking this link: <a href="${emailVerificationLink}">VERIFY</a>`,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Verify your account visiting this link: ${emailVerificationLink}`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Verify your account',
        },
      },
    },
    console.log,
  )
}

const sendPasswordRecoveryEmail = (email, userId) => {
  // TODO: use different jwt secrets?
  const recoveryToken = generatePasswordRecoveryToken(
    userId,
    process.env.JWT_SECRET,
  )

  // TODO: update this with the real link
  const emailRecoverylink =
    `https://igloocloud.github.io/IglooAurora/recovery/${recoveryToken}`

  // TODO: create a template for the email verification
  ses.sendEmail(
    {
      Source: "'Igloo Cloud' <recovery@igloo.ooo>",
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `Change your password clicking this link: <a href="${emailRecoverylink}">Recover password</a>`,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Change your password at this link: ${emailRecoverylink}`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Verify your account',
        },
      },
    },
    console.log,
  )
}

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
  findAllValues,
  findValue,
  genericDelete,
  generatePermanentAuthenticationToken,
  socketToDeviceMap,
  sendVerificationEmail,
  generatePasswordRecoveryToken,
  sendPasswordRecoveryEmail,
}
