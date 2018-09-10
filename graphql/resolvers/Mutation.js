import bcrypt from 'bcryptjs'
import OTP from 'otp.js'
import {
  authenticated,
  generateAuthenticationToken,
  generatePermanentAuthenticationToken,
  CreateGenericValue,
  genericValueMutation,
  create2FSecret,
  check2FCode,
  logErrorsPromise,
  getPropsIfDefined,
  sendVerificationEmail,
  sendPasswordRecoveryEmail,
  sendPasswordUpdatedEmail,
  sendTokenCreatedEmail,
  authorized,
  deviceToParents,
  authorizedValue,
  instancesToSharedIds,
  inheritAuthorized,
  valueToParents,
} from './utilities'
import webpush from 'web-push'
import Stripe from 'stripe'
import { Op } from 'sequelize'
import zxcvbn from 'zxcvbn'

require('dotenv').config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

webpush.setVapidDetails(
  'http://igloo.witlab.io/',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY,
)
const SALT_ROUNDS = 10
const MUTATION_COST = 2

const stripe = Stripe('sk_test_pku6xMd2Tjlv5EU4GkZHw7aS')

const isNotNullNorUndefined = value => value !== undefined && value !== null
const isOutOfBoundaries = (boundaries, value) =>
  value < boundaries[0] || value > boundaries[1]

const genericShare = (Model, idField, User, childToParents) => (
  root,
  args,
  context,
) =>
  logErrorsPromise(
    'genericShare',
    921,
    authorized(
      args[idField],
      context,
      Model,
      User,
      3,
      async (resolve, reject, found) => {
        const userFound = await User.find({ where: { email: args.email } })

        // remove old role
        await Promise.all([
          userFound[`remove${Model.Admins}`](found),
          userFound[`remove${Model.Editors}`](found),
          userFound[`remove${Model.Spectators}`](found),
        ])

        // add new role
        const parsedRole = `${args.role[0] + args.role.slice(1).toLowerCase()}s`
        await userFound[`add${Model[parsedRole]}`](found)

        resolve(found)
        context.billingUpdater.update(MUTATION_COST)
      },
      childToParents,
    ),
  )

const MutationResolver = (
  {
    User,
    PermanentToken,
    Device,
    Board,
    FloatValue,
    StringValue,
    BoolValue,
    ColourValue,
    MapValue,
    PlotValue,
    PlotNode,
    StringPlotValue,
    StringPlotNode,
    Notification,
  },
  WebPushSubscription,
  pubsub,
  JWT_SECRET,
) => ({
  // checks if the user exists, if so
  // compares the given password with the hash
  // and returns an access token
  AuthenticateUser(root, args) {
    return logErrorsPromise(
      'AuthenticateUser',
      103,
      async (resolve, reject) => {
        const userFound = await User.find({ where: { email: args.email } })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (
          !bcrypt.compareSync(args.password, userFound.dataValues.password)
        ) {
          reject('Wrong password')
        } else if (!userFound.twoFactorSecret) {
          resolve({
            id: userFound.dataValues.id,
            token: generateAuthenticationToken(
              userFound.dataValues.id,
              JWT_SECRET,
            ),
          })
        } else if (check2FCode(args.twoFactorCode, userFound.twoFactorSecret)) {
          resolve({
            id: userFound.dataValues.id,
            token: generateAuthenticationToken(
              userFound.dataValues.id,
              JWT_SECRET,
            ),
          })
        } else {
          reject('Wrong or missing 2-Factor Authentication Code')
        }
      },
    )
  },
  SendPasswordRecoveryEmail(root, args, context) {
    return logErrorsPromise(
      'SendPasswordRecoveryEmail',
      901,
      async (resolve, reject) => {
        const userFound = await User.find({ where: { email: args.email } })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else {
          sendPasswordRecoveryEmail(userFound.email, userFound.id)

          resolve(true)
        }
      },
    )
  },
  GeneratePermanentAccessToken(root, args, context) {
    return logErrorsPromise(
      'GeneratePermanentAccessToken',
      125,
      authenticated(context, async (resolve, reject) => {
        if (args.customName === '') {
          reject('Empty name is not allowed')
        } else {
          const databaseToken = await PermanentToken.create({
            customName: args.customName,
            userId: context.auth.userId,
          })

          resolve({
            id: databaseToken.id,
            token: generatePermanentAuthenticationToken(
              context.auth.userId,
              databaseToken.id,
              'DEVICE',
              JWT_SECRET,
            ),
          })

          const resolveObj = {
            id: databaseToken.id,
            customName: databaseToken.customName,
            user: { id: context.auth.userId },
          }
          pubsub.publish('tokenCreated', {
            tokenCreated: resolveObj,
            userId: context.auth.userId,
          })

          const userFound = await User.find({
            where: { id: context.auth.userId },
          })

          sendTokenCreatedEmail(userFound.email)
        }
      }),
    )
  },

  DeletePermanentAccesToken(root, args, context) {
    return logErrorsPromise(
      'DeletePermanentAccesToken',
      126,
      authenticated(context, async (resolve, reject) => {
        const databaseToken = await PermanentToken.find({
          where: { id: args.id },
        })
        if (!databaseToken) {
          reject("This token doesn't exist")
        } else if (databaseToken.userId !== context.auth.userId) {
          reject('This token is not yours')
        } else {
          await databaseToken.destroy()

          resolve(args.id)
          pubsub.publish('tokenDeleted', {
            tokenDeleted: args.id,
            userId: context.auth.userId,
          })
        }
      }),
    )
  },
  // checks if a user with that email already exists
  // if not it creates one and returnes an access token
  SignupUser(root, args) {
    return logErrorsPromise('SignupUser', 102, async (resolve, reject) => {
      // check password strength
      if (zxcvbn(args.password).score < 2) {
        reject('Password too weak, avoid easily guessable password or short ones')
        return
      }

      const userFound = await User.find({ where: { email: args.email } })
      if (userFound) {
        reject('A user with this email already exists')
      } else {
        const encryptedPass = bcrypt.hashSync(args.password, SALT_ROUNDS)
        try {
          const newUser = await User.create({
            email: args.email,
            password: encryptedPass,
            quietMode: false,
            language: 'en-GB',
            timezone: '+00:00_Greenwich', // TODO: Daylight Saving Time
            devMode: false,
            nightMode: false,
            monthUsage: 0,
            paymentPlan: 'FREE',
            emailIsVerified: false,
            displayName: args.displayName,
          })

          resolve({
            id: newUser.dataValues.id,
            token: generateAuthenticationToken(
              newUser.dataValues.id,
              JWT_SECRET,
            ),
          })

          sendVerificationEmail(args.email, newUser.id)
        } catch (e) {
          console.log(e)
          if (e.errors[0].validatorKey === 'isEmail') {
            reject('Invalid email')
          } else {
            /* istanbul ignore next */
            throw e
          }
        }
      }
    })
  },
  UpgradeTo2FactorAuthentication(root, args, context) {
    return logErrorsPromise(
      'UpgradeTo2FactorAuthentication',
      118,
      authenticated(context, async (resolve, reject) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        /* istanbul ignore if - should ever happen */
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (!userFound.twoFactorSecret) {
          const { secret, qrCode } = create2FSecret(userFound.email)
          await userFound.update({ twoFactorSecret: secret })
          resolve({ secret, qrCode })
        } else {
          const qrCode = OTP.googleAuthenticator.qrCode(
            userFound.email,
            'igloo',
            userFound.twoFactorSecret,
          )

          resolve({
            secret: userFound.twoFactorSecret,
            qrCode,
          })
        }
      }),
    )
  },
  // changes the password and returns an access token
  ChangePassword(root, args, context) {
    return logErrorsPromise(
      'ChangePassword',
      101,
      authenticated(
        context,
        async (resolve, reject) => {
          const userFound = await User.find({
            where: { id: context.auth.userId },
          })
          if (!userFound) {
            reject("User doesn't exist. Use `SignupUser` to create one")
          } else {
            const encryptedPass = bcrypt.hashSync(args.newPassword, SALT_ROUNDS)

            const newUser = await userFound.update({
              password: encryptedPass,
            })
            resolve({
              id: newUser.dataValues.id,
              token: generateAuthenticationToken(
                newUser.dataValues.id,
                JWT_SECRET,
              ),
            })

            sendPasswordUpdatedEmail(userFound.email)
          }
        },
        ['TEMPORARY', 'PERMANENT', 'PASSWORD_RECOVERY'],
      ),
    )
  },
  ResendVerificationEmail(root, args, context) {
    return logErrorsPromise(
      'ResendVerificationEmail',
      900,
      authenticated(context, async (resolve, reject) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (userFound.emailIsVerified) {
          reject('This user has already verified their email')
        } else {
          resolve(true)
          sendVerificationEmail(userFound.email, userFound.id)
        }
      }),
    )
  },
  shareBoard: genericShare(Board, 'boardId', User),
  shareDevice: genericShare(Device, 'deviceId', User, deviceToParents(Board)),
  shareValue: (root, args, context) =>
    logErrorsPromise(
      'shareValue',
      921,
      authorizedValue(
        args.valueId,
        context,
        {
          FloatValue,
          StringValue,
          BoolValue,
          ColourValue,
          MapValue,
          PlotValue,
          StringPlotValue,
        },
        User,
        3,
        async (resolve, reject, valueFound) => {
          const userFound = await User.find({ where: { email: args.email } })

          // remove old role
          await Promise.all([
            userFound[`remove${valueFound.Model.Admins}`](valueFound),
            userFound[`remove${valueFound.Model.Editors}`](valueFound),
            userFound[`remove${valueFound.Model.Spectators}`](valueFound),
          ])

          // add new role
          const parsedRole = `${args.role[0] +
            args.role.slice(1).toLowerCase()}s`
          await userFound[`add${valueFound.Model[parsedRole]}`](valueFound)

          resolve(valueFound)

          context.billingUpdater.update(MUTATION_COST)
        },
        Device,
        Board,
      ),
    ),
  CreateBoard(root, args, context) {
    return logErrorsPromise(
      'CreateBoard',
      910,
      authenticated(context, async (resolve, reject) => {
        const newBoard = await Board.create({
          ...args,
          // if favorite or quietMode are not passed then set them to false
          favorite: !!args.favorite,
          quietMode: !!args.quietMode,
          index:
            args.index !== null && args.index !== undefined
              ? args.index
              : await Board.count({ where: { ownerId: context.auth.userId } }),
        })

        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        await userFound.addOwnBoard(newBoard)
        await newBoard.setOwner(userFound)

        const resolveValue = {
          ...newBoard.dataValues,
          owner: { id: newBoard.ownerId },
          devices: [],
        }

        pubsub.publish('boardCreated', {
          boardCreated: resolveValue,
          userId: context.auth.userId,
        })

        resolve(resolveValue)

        context.billingUpdater.update(MUTATION_COST)
      }),
    )
  },
  CreateDevice(root, args, context) {
    return logErrorsPromise(
      'CreateDevice',
      104,
      // REPLACE WITH authorized(boardId) also in the subscription
      authenticated(context, async (resolve, reject) => {
        // checks that batteryStatus and signalStatus are within boundaries [0,100]
        if (
          isNotNullNorUndefined(args.batteryStatus) &&
          isOutOfBoundaries([0, 100], args.batteryStatus)
        ) {
          reject('batteryStatus is out of boundaries [0,100]')
          return
        } else if (
          isNotNullNorUndefined(args.signalStatus) &&
          isOutOfBoundaries([0, 100], args.signalStatus)
        ) {
          reject('signalStatus is out of boundaries [0,100]')
          return
        } else if (args.customName === '') {
          reject('Custom name cannot be an empty string')
          return
        }

        const index =
          args.index !== null && args.index !== undefined
            ? args.index
            : await Device.count({ where: { ownerId: context.auth.userId } })

        // TODO: check that the boardId passed is a board to which the user has access
        const newDevice = await Device.create({
          ...args,
          index,
        })

        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        await userFound.addOwnDevice(newDevice)
        await newDevice.setOwner(userFound)

        const resolveValue = {
          ...newDevice.dataValues,
          board: newDevice.boardId
            ? {
              id: newDevice.boardId,
            }
            : null,
        }

        pubsub.publish('deviceCreated', {
          deviceCreated: resolveValue,
          userIds: [context.auth.userId],
        })

        resolve(resolveValue)

        context.billingUpdater.update(MUTATION_COST)
      }),
    )
  },
  CreateFloatValue: CreateGenericValue(
    User,
    Device,
    Board,
    FloatValue,
    'FloatValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
    (args, reject) => {
      if (
        isNotNullNorUndefined(args.boundaries) &&
        (args.boundaries.length !== 2 ||
          args.boundaries[0] >= args.boundaries[1])
      ) {
        reject('Boundaries should be a [min, max] array')
        return false
      } else if (
        isNotNullNorUndefined(args.boundaries) &&
        isOutOfBoundaries(args.boundaries, args.value)
      ) {
        reject('Value is out of boundaries')
        return false
      }
      return true
    },
  ),
  CreateStringValue: CreateGenericValue(
    User,
    Device,
    Board,
    StringValue,
    'StringValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
    (args, reject) => {
      if (isNotNullNorUndefined(args.maxChars) && args.maxChars <= 0) {
        reject('maxChars must be greater than 0')
        return false
      } else if (
        isNotNullNorUndefined(args.maxChars) &&
        args.value.length > args.maxChars
      ) {
        reject('Value exceeds the maxChars')
        return false
      } else if (
        isNotNullNorUndefined(args.allowedValues) &&
        args.allowedValues.indexOf(args.value) === -1
      ) {
        reject('Value is not among the allowedValues')
        return false
      }
      return true
    },
  ),
  CreateBooleanValue: CreateGenericValue(
    User,
    Device,
    Board,
    BoolValue,
    'BoolValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
  ),
  CreateColourValue: CreateGenericValue(
    User,
    Device,
    Board,
    ColourValue,
    'ColourValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
    (args, reject) => {
      if (
        isNotNullNorUndefined(args.allowedValues) &&
        args.allowedValues.indexOf(args.value) === -1
      ) {
        reject('Value is not among the allowedValues')
        return false
      }
      return true
    },
  ),
  CreateMapValue: CreateGenericValue(
    User,
    Device,
    Board,
    MapValue,
    'MapValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
  ),
  CreatePlotValue: CreateGenericValue(
    User,
    Device,
    Board,
    PlotValue,
    'PlotValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
  ),
  CreateStringPlotValue: CreateGenericValue(
    User,
    Device,
    Board,
    StringPlotValue,
    'StringPlotValue',
    [
      FloatValue,
      StringValue,
      BoolValue,
      ColourValue,
      MapValue,
      PlotValue,
      StringPlotValue,
    ],
    pubsub,
  ),
  CreatePlotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      authorized(
        args.plotId,
        context,
        PlotValue,
        User,
        2,
        async (resolve, reject, plotValueFound, plotAndParents) => {
          const plotNode = await PlotNode.create({
            ...args,
            timestamp: args.timestamp || new Date(),
            deviceId: plotValueFound.deviceId,
            userId: context.auth.userId,
          })

          plotNode.setPlot(plotValueFound)
          plotValueFound.addPlotNode(plotNode)

          const resolveObj = {
            ...plotNode.dataValues,
            user: {
              id: plotNode.userId,
            },
            device: {
              id: plotNode.deviceId,
            },
            plot: {
              id: plotNode.plotId,
            },
          }

          resolve(resolveObj)
          pubsub.publish('plotNodeCreated', {
            plotNodeCreated: resolveObj,
            userIds: await instancesToSharedIds(plotAndParents),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  CreateStringPlotNode(root, args, context) {
    return logErrorsPromise(
      'CreateStringPlotNode mutation',
      139,
      authorized(
        args.plotId,
        context,
        StringPlotValue,
        User,
        2,
        async (resolve, reject, plotValueFound, plotAndParents) => {
          const plotNode = await StringPlotNode.create({
            ...args,
            timestamp: args.timestamp || new Date(),
            deviceId: plotValueFound.deviceId,
            userId: context.auth.userId,
          })

          plotNode.setPlot(plotValueFound)
          plotValueFound.addStringPlotNode(plotNode)

          const resolveObj = {
            ...plotNode.dataValues,
            user: {
              id: plotNode.userId,
            },
            device: {
              id: plotNode.deviceId,
            },
            plot: {
              id: plotNode.plotId,
            },
          }

          resolve(resolveObj)
          pubsub.publish('stringPlotNodeCreated', {
            stringPlotNodeCreated: resolveObj,
            userIds: await instancesToSharedIds(plotAndParents),
          })
          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  user(root, args, context) {
    let permissionRequired
    const mutationFields = Object.keys(args)
    if (mutationFields.length === 1 && mutationFields[0] === 'usageCap') {
      permissionRequired = ['TEMPORARY', 'PERMANENT', 'CHANGE_USAGE_CAP']
    } else if (
      mutationFields.length === 1 &&
      mutationFields[0] === 'paymentPlan'
    ) {
      permissionRequired = ['TEMPORARY', 'PERMANENT', 'SWITCH_TO_PAYING']
    }

    return logErrorsPromise(
      'user mutation',
      115,
      authenticated(
        context,
        async (resolve, reject) => {
          const userFound = await User.find({
            where: { id: context.auth.userId },
          })

          if (!userFound) {
            reject("User doesn't exist. Use `SignupUser` to create one")
          } else {
            const updateObj = args.email
              ? { ...args, emailIsVerified: false }
              : args
            const newUser = await userFound.update(updateObj)
            resolve(newUser.dataValues)

            pubsub.publish('userUpdated', {
              userUpdated: newUser.dataValues,
              userId: context.auth.userId,
            })

            if (args.email) {
              sendVerificationEmail(args.email, newUser.id)
            }

            // if we are the mutation is not a usageCap or paymentPlan update bill it
            if (permissionRequired === undefined) {
              context.billingUpdater.update(MUTATION_COST)
            }
          }
        },
        permissionRequired,
      ),
    )
  },
  updatePaymentInfo(root, args, context) {
    return logErrorsPromise(
      'updatePaymentInfo',
      500,
      authenticated(context, async (resolve, reject) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (userFound.stripeCustomerId) {
          // replaces customer payment method
          await stripe.customers.createSource(userFound.stripeCustomerId, {
            source: args.stripeToken,
          })

          resolve(true)
        } else {
          // create a new customer and attaches
          const customer = await stripe.customers.create({
            email: userFound.email,
            source: args.stripeToken,
          })

          await userFound.update({
            stripeCustomerId: customer.id,
          })

          resolve(true)
          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    )
  },
  board(root, args, context) {
    return logErrorsPromise(
      'board mutation',
      911,
      authorized(
        args.id,
        context,
        Board,
        User,
        2,
        async (resolve, reject, boardFound) => {
          const newBoard = await boardFound.update(args)

          resolve(newBoard.dataValues)
          pubsub.publish('boardUpdated', {
            boardUpdated: newBoard.dataValues,
            userIds: await instancesToSharedIds([boardFound]),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
      ),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      'device mutation',
      116,
      authorized(
        args.id,
        context,
        Device,
        User,
        2,
        async (resolve, reject, deviceFound, deviceAndBoard) => {
          // checks that batteryStatus and signalStatus are within boundaries [0,100]
          if (
            isNotNullNorUndefined(args.batteryStatus) &&
            isOutOfBoundaries([0, 100], args.batteryStatus)
          ) {
            reject('batteryStatus is out of boundaries [0,100]')
            return
          } else if (
            isNotNullNorUndefined(args.signalStatus) &&
            isOutOfBoundaries([0, 100], args.signalStatus)
          ) {
            reject('signalStatus is out of boundaries [0,100]')
            return
          } else if (args.customName === null || args.customName === '') {
            reject('customName cannot be null or an empty string')
            return
          }

          const newDevice = await deviceFound.update(args)
          resolve(newDevice.dataValues)
          pubsub.publish('deviceUpdated', {
            deviceUpdated: newDevice.dataValues,
            userIds: await instancesToSharedIds(deviceAndBoard),
          })
          context.billingUpdater.update(MUTATION_COST)
        },
        deviceToParents(Board),
      ),
    )
  },
  resetOnlineState(root, args, context) {
    return logErrorsPromise(
      'resetOnlineState mutation',
      4000,
      authorized(
        args.deviceId,
        context,
        Device,
        User,
        2,
        async (resolve, reject, deviceFound, deviceAndBoard) => {
          const newDevice = await deviceFound.update({ online: null })
          resolve(newDevice.dataValues)
          pubsub.publish('deviceUpdated', {
            deviceUpdated: newDevice.dataValues,
            userIds: await instancesToSharedIds(deviceAndBoard),
          })
          context.billingUpdater.update(MUTATION_COST)
        },
        deviceToParents(Board),
      ),
    )
  },
  floatValue: genericValueMutation(
    FloatValue,
    'FloatValue',
    pubsub,
    User,
    Device,
    Board,
    (args, valueFound, reject) => {
      if (
        isNotNullNorUndefined(args.boundaries) &&
        args.boundaries.length !== 2
      ) {
        reject('Boundaries should be an array containing min and max ([min, max])')
        return false
      } else if (
        isNotNullNorUndefined(args.boundaries) &&
        args.boundaries[0] >= args.boundaries[1]
      ) {
        reject('The min value should be less than the max value, boundaries should be an array [min, max]')
      } else if (
        isNotNullNorUndefined(args.value) &&
        (isNotNullNorUndefined(args.boundaries) ||
          isNotNullNorUndefined(valueFound.boundaries)) &&
        (isNotNullNorUndefined(args.boundaries)
          ? isOutOfBoundaries(args.boundaries, args.value)
          : isOutOfBoundaries(valueFound.boundaries, args.value))
      ) {
        reject('Value is out of boundaries')
        return false
      } else if (
        !isNotNullNorUndefined(args.value) &&
        isNotNullNorUndefined(args.boundaries) &&
        isOutOfBoundaries(args.boundaries, valueFound.value)
      ) {
        reject('Current value is out of boundaries')
        return false
      } else {
        return true
      }
    },
  ),
  stringValue: genericValueMutation(
    StringValue,
    'StringValue',
    pubsub,
    User,
    Device,
    Board,
    (args, valueFound, reject) => {
      // Current or new value should respect maxChars and allowedValue

      if (isNotNullNorUndefined(args.maxChars) && args.maxChars <= 0) {
        reject('maxChars must be greater than 0')
        return false
      } else if (
        isNotNullNorUndefined(args.value) &&
        (isNotNullNorUndefined(args.maxChars) ||
          isNotNullNorUndefined(valueFound.maxChars)) &&
        (isNotNullNorUndefined(args.maxChars)
          ? args.value.length > args.maxChars
          : args.value.length > valueFound.maxChars)
      ) {
        reject('The value provided exceeds the maxChars')
        return false
      } else if (
        isNotNullNorUndefined(args.value) &&
        (isNotNullNorUndefined(args.allowedValues) ||
          isNotNullNorUndefined(valueFound.allowedValues)) &&
        (isNotNullNorUndefined(args.allowedValues)
          ? args.allowedValues.indexOf(args.value) === -1
          : valueFound.allowedValues.indexOf(args.value) === -1)
      ) {
        reject('The value is not among the allowedValues')
        return false
      } else if (
        !isNotNullNorUndefined(args.value) &&
        isNotNullNorUndefined(args.allowedValues) &&
        args.allowedValues.indexOf(valueFound.value) === -1
      ) {
        reject('Current value is not among the allowedValues')
        return false
      } else if (
        !isNotNullNorUndefined(args.value) &&
        isNotNullNorUndefined(args.maxChars) &&
        valueFound.value.length > args.maxChars
      ) {
        reject('Current value exceeds maxChars')
        return false
      }
      return true
    },
  ),
  booleanValue: genericValueMutation(
    BoolValue,
    'BooleanValue',
    pubsub,
    User,
    Device,
    Board,
  ),
  colourValue: genericValueMutation(
    ColourValue,
    'ColourValue',
    pubsub,
    User,
    Device,
    Board,
    (args, valueFound, reject) => {
      if (
        isNotNullNorUndefined(args.value) &&
        (isNotNullNorUndefined(args.allowedValues) ||
          isNotNullNorUndefined(valueFound.allowedValues)) &&
        (isNotNullNorUndefined(args.allowedValues)
          ? args.allowedValues.indexOf(args.value) === -1
          : valueFound.allowedValues.indexOf(args.value) === -1)
      ) {
        reject('The value is not among the allowedValues')
        return false
      } else if (
        !isNotNullNorUndefined(args.value) &&
        isNotNullNorUndefined(args.allowedValues) &&
        args.allowedValues.indexOf(valueFound.value) === -1
      ) {
        reject('Current value is not among the allowedValues')
        return false
      }
      return true
    },
  ),
  mapValue: genericValueMutation(
    MapValue,
    'MapValue',
    pubsub,
    User,
    Device,
    Board,
  ),
  plotValue: genericValueMutation(
    PlotValue,
    'PlotValue',
    pubsub,
    User,
    Device,
    Board,
  ),
  stringPlotValue: genericValueMutation(
    StringPlotValue,
    'StringPlotValue',
    pubsub,
    User,
    Device,
    Board,
  ),
  plotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      inheritAuthorized(
        args.id,
        PlotNode,
        User,
        plotNodeFound => plotNodeFound.plotId,
        context,
        PlotValue,
        2,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotAndParents,
        ) => {
          const newNode = await plotNodeFound.update(args)

          const resolveObj = {
            ...newNode.dataValues,
            user: {
              id: newNode.dataValues.userId,
            },
            device: {
              id: newNode.dataValues.deviceId,
            },
            plot: {
              id: newNode.dataValues.plotId,
            },
          }
          resolve(resolveObj)
          pubsub.publish('plotNodeUpdated', {
            plotNodeUpdated: resolveObj,
            userIds: await instancesToSharedIds(plotAndParents),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  stringPlotNode(root, args, context) {
    return logErrorsPromise(
      'stringPlotNode mutation',
      139,
      inheritAuthorized(
        args.id,
        StringPlotNode,
        User,
        plotNodeFound => plotNodeFound.plotId,
        context,
        StringPlotValue,
        2,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotAndParents,
        ) => {
          const newNode = await plotNodeFound.update(args)

          const resolveObj = {
            ...newNode.dataValues,
            user: {
              id: newNode.dataValues.userId,
            },
            device: {
              id: newNode.dataValues.deviceId,
            },
            plot: {
              id: newNode.dataValues.plotId,
            },
          }
          resolve(resolveObj)
          pubsub.publish('stringPlotNodeUpdated', {
            stringPlotNodeUpdated: resolveObj,
            userIds: await instancesToSharedIds(plotAndParents),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  CreateNotification(root, args, context) {
    return logErrorsPromise(
      'create notification mutation',
      122,
      authorized(
        args.deviceId,
        context,
        Device,
        User,
        2,
        async (resolve, reject, deviceFound, deviceAndBoard) => {
          const newNotification = await Notification.create({
            ...args,
            visualized: false,
            snackbarVisualized: false,
            userId: context.auth.userId,
            date: args.date || new Date(),
          })

          deviceFound.addNotification(newNotification)
          newNotification.setDevice(deviceFound)

          const {
            visualized,
            content,
            date,
            userId,
            deviceId,
            id,
          } = newNotification.dataValues

          const resolveValue = {
            id,
            visualized,
            content,
            date,
            user: {
              id: userId,
            },
            device: {
              id: deviceId,
            },
          }

          resolve(resolveValue)

          const deviceSharedIds = await instancesToSharedIds(deviceAndBoard)
          pubsub.publish('notificationCreated', {
            notificationCreated: resolveValue,
            userIds: deviceSharedIds,
          })

          // the notificationsCount props are updated so send the device and board subscriptions
          pubsub.publish('deviceUpdated', {
            deviceUpdated: {
              id: deviceId,
            },
            userIds: deviceSharedIds,
          })
          if (deviceFound.boardId) {
            const boardFound = await Board.find({
              where: { id: deviceFound.boardId },
            })
            pubsub.publish('boardUpdated', {
              boardUpdated: boardFound.dataValues,
              userIds: await instancesToSharedIds([boardFound]),
            })
          }
          context.billingUpdater.update(MUTATION_COST)

          // TODO: get userFound from callback
          const userFound = await User.find({
            where: { id: context.auth.userId },
          })

          if (!userFound.quietMode) {
            const notificationSubscriptions = await WebPushSubscription.findAll({
              where: {
                userId: {
                  [Op.in]: deviceSharedIds,
                },
              },
            })

            notificationSubscriptions.map(notificationSubscription =>
              webpush.sendNotification(
                {
                  endpoint: notificationSubscription.endpoint,
                  expirationTime: notificationSubscription.expirationTime,
                  keys: {
                    p256dh: notificationSubscription.p256dh,
                    auth: notificationSubscription.auth,
                  },
                },
                JSON.stringify({
                  content,
                  date,
                  device: deviceFound,
                }),
              ))
          }
        },
        deviceToParents(Board),
      ),
    )
  },
  async notification(root, args, context) {
    const notificationFound = await Notification.find({
      where: { id: args.id },
    })

    if (!notificationFound) {
      reject('The requested resource does not exist')
    } else {
      return logErrorsPromise(
        'notification mutation',
        123,
        authorized(
          notificationFound.deviceId,
          context,
          Device,
          User,
          2,
          async (resolve, reject, deviceFound, deviceAndParent) => {
            const updateQuery = getPropsIfDefined(args, [
              'content',
              'date',
              'visualized',
            ])

            const {
              date,
              visualized,
              content,
              id,
              userId,
              deviceId,
            } = (await notificationFound.update(updateQuery)).dataValues

            const resolveValue = {
              date,
              visualized,
              content,
              id,
              user: { id: userId },
              device: { id: deviceId },
            }

            resolve(resolveValue)

            const deviceSharedIds = await instancesToSharedIds(deviceAndParent)
            pubsub.publish('notificationUpdated', {
              notificationUpdated: resolveValue,
              userIds: deviceSharedIds,
            })

            context.billingUpdater.update(MUTATION_COST)
          },
          deviceToParents(Board),
        ),
      )
    }
  },
  async deleteNotification(root, args, context) {
    const notificationFound = await Notification.find({
      where: { id: args.id },
    })

    if (!notificationFound) {
      throw new Error('The requested resource does not exist')
    } else {
      return logErrorsPromise(
        'notification mutation',
        1001,
        authorized(
          notificationFound.deviceId,
          context,
          Device,
          User,
          2,
          async (resolve, reject, deviceFound, deviceAndParent) => {
            await notificationFound.destroy()

            resolve(args.id)

            const deviceSharedIds = await instancesToSharedIds(deviceAndParent)
            pubsub.publish('notificationDeleted', {
              notificationDeleted: args.id,
              userIds: deviceSharedIds,
            })

            // the notificationsCount props are updated so send the device and board subscriptions
            pubsub.publish('deviceUpdated', {
              deviceUpdated: {
                id: deviceFound.id,
              },
              userIds: deviceSharedIds,
            })
            if (deviceFound.boardId) {
              const boardFound = await Board.find({
                where: { id: deviceFound.boardId },
              })
              pubsub.publish('boardUpdated', {
                boardUpdated: boardFound.dataValues,
                userIds: await instancesToSharedIds([boardFound]),
              })
            }
            context.billingUpdater.update(MUTATION_COST)
          },
          deviceToParents(Board),
        ),
      )
    }
  },
  deleteValue: (root, args, context) =>
    logErrorsPromise(
      'delete value',
      124,
      authorizedValue(
        args.id,
        context,
        {
          FloatValue,
          StringValue,
          BoolValue,
          ColourValue,
          MapValue,
          PlotValue,
          StringPlotValue,
        },
        User,
        3,
        async (resolve, reject, valueFound, valueAndParents) => {
          const authorizedUsersIds = await instancesToSharedIds(valueAndParents)

          // TODO: if value is plot remove nodes
          await valueFound.destroy()

          pubsub.publish('valueDeleted', {
            valueDeleted: args.id,
            userIds: authorizedUsersIds,
          })
          resolve(args.id)
          context.billingUpdater.update(MUTATION_COST)
        },
        Device,
        Board,
      ),
    ),
  deleteDevice: (root, args, context) =>
    logErrorsPromise(
      'delete device mutation',
      126,
      authorized(
        args.id,
        context,
        Device,
        User,
        3,
        async (resolve, reject, deviceFound, deviceAndParent) => {
          const authorizedUsersIds = await instancesToSharedIds(deviceAndParent)
          const deleteChild = Model =>
            Model.destroy({
              where: {
                deviceId: args.id,
              },
            })

          await Promise.all([
            FloatValue,
            StringValue,
            ColourValue,
            BoolValue,
            MapValue,
            PlotValue,
            StringPlotValue,
            PlotNode,
            StringPlotNode,
            Notification,
          ].map(deleteChild))

          await deviceFound.destroy()

          pubsub.publish('deviceDeleted', {
            deviceDeleted: args.id,
            userIds: authorizedUsersIds,
          })

          resolve(args.id)
          context.billingUpdater.update(MUTATION_COST)
        },
        deviceToParents(Board),
      ),
    ),
  deleteBoard: (root, args, context) =>
    logErrorsPromise(
      'delete board mutation',
      913,
      authorized(
        args.id,
        context,
        Board,
        User,
        3,
        async (resolve, reject, boardFound) => {
          const authorizedUsersIds = instancesToSharedIds([boardFound])
          const devices = await Device.findAll({
            where: { boardId: boardFound.id },
          })

          const deleteDevicesPromises = devices.map(async (device) => {
            const deleteChild = Model =>
              Model.destroy({
                where: {
                  deviceId: device.id,
                },
              })

            await Promise.all([
              FloatValue,
              StringValue,
              ColourValue,
              BoolValue,
              MapValue,
              PlotValue,
              StringPlotValue,
              PlotNode,
              Notification,
            ].map(deleteChild))

            await device.destroy()
          })
          await Promise.all(deleteDevicesPromises)

          await boardFound.destroy()

          pubsub.publish('boardDeleted', {
            boardDeleted: args.id,
            userIds: authorizedUsersIds,
          })
          resolve(args.id)

          context.billingUpdater.update(MUTATION_COST)
        },
      ),
    ),
  deletePlotNode(root, args, context) {
    return logErrorsPromise(
      'deletePlotNode mutation',
      139,
      inheritAuthorized(
        args.id,
        PlotNode,
        User,
        plotNodeFound => plotNodeFound.plotId,
        context,
        PlotValue,
        2,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotAndParents,
        ) => {
          await plotNodeFound.destroy()

          resolve(args.id)
          pubsub.publish('plotNodeDeleted', {
            plotNodeDeleted: args.id,
            userIds: await instancesToSharedIds(plotAndParents),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  deleteStringPlotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      inheritAuthorized(
        args.id,
        StringPlotNode,
        User,
        plotNodeFound => plotNodeFound.plotId,
        context,
        StringPlotValue,
        2,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotAndParents,
        ) => {
          await plotNodeFound.destroy()

          resolve(args.id)
          pubsub.publish('plotNodeDeleted', {
            plotNodeDeleted: args.id,
            userIds: await instancesToSharedIds(plotAndParents),
          })

          context.billingUpdater.update(MUTATION_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  // TODO: implement this
  // deleteUser: (root, args, context) =>
  //   logErrorsPromise(
  //     'delete device mutation',
  //     126,
  //     authenticated(context, async (resolve, reject) => {
  //       const userFound = await User.find({
  //         where: { id: context.auth.userId },
  //       })

  //       if (!userFound) {
  //         reject('The requested resource does not exist')
  //       } else if (!bcrypt.compareSync(args.password, userFound.password)) {
  //         reject('Wrong password')
  //       } else if (
  //         !userFound.twoFactorSecret ||
  //         check2FCode(args.twoFactorCode, userFound.twoFactorSecret)
  //       ) {
  //         const deleteChild = Model =>
  //           Model.destroy({
  //             where: {
  //               userId: context.auth.userId,
  //             },
  //           })

  //         await Promise.all([FloatValue, StringValue, ColourValue, BoolValue, Notification].map(deleteChild))

  //         // removing the devices before having cleaned the values errors
  //         // due to relationships on the sql database
  //         await Device.destroy({
  //           where: {
  //             userId: context.auth.userId,
  //           },
  //         })

  //         await userFound.destroy()

  //         pubsub.publish('userDeleted', {
  //           userDeleted: context.auth.userId,
  //           userId: context.auth.userId,
  //         })
  //         resolve(context.auth.userId)
  //       } else {
  //         reject('Wrong two factor code')
  //       }
  //     }),
  //   ),
})

export default MutationResolver
