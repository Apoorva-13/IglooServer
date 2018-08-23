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
  genericDelete,
  sendVerificationEmail,
  sendPasswordRecoveryEmail,
  sendPasswordUpdatedEmail,
  sendTokenCreatedEmail,
  authorized,
  deviceToParents,
  authorizedValue,
} from './utilities'
import webpush from 'web-push'
import Stripe from 'stripe'

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
      3,
      async (resolve, reject, found) => {
        const userFound = await User.find({ where: { email: args.email } })

        // clear previous role
        let { adminsIds, editorsIds, spectatorsIds } = found

        adminsIds = adminsIds.filter(id => id !== userFound.id)
        editorsIds = adminsIds.filter(id => id !== userFound.id)
        spectatorsIds = adminsIds.filter(id => id !== userFound.id)

        // add new role
        if (args.role === 'ADMIN') adminsIds.push(userFound.id)
        else if (args.role === 'EDITOR') editorsIds.push(userFound.id)
        else if (args.role === 'SPECTATOR') spectatorsIds.push(userFound.id)

        const updated = await found.update({
          adminsIds,
          editorsIds,
          spectatorsIds,
        })

        resolve(updated)

        context.billingUpdater.update(MUTATION_COST)
      },
      childToParents,
    ),
  )

const MutationResolver = (
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
        if (args.name === '') {
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
      const user = await User.find({ where: { email: args.email } })
      if (user) {
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
  // checks that the provided email and password are correct
  // if so changes the password and returns an access token
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
      authenticated(context, async (resolve) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
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
        3,
        async (resolve, reject, valueFound) => {
          const userFound = await User.find({ where: { email: args.email } })

          // clear previous role
          let { adminsIds, editorsIds, spectatorsIds } = valueFound

          adminsIds = adminsIds.filter(id => id !== userFound.id)
          editorsIds = adminsIds.filter(id => id !== userFound.id)
          spectatorsIds = adminsIds.filter(id => id !== userFound.id)

          // add new role
          if (args.role === 'ADMIN') adminsIds.push(userFound.id)
          else if (args.role === 'EDITOR') editorsIds.push(userFound.id)
          else if (args.role === 'SPECTATOR') spectatorsIds.push(userFound.id)

          const updated = await valueFound.update({
            adminsIds,
            editorsIds,
            spectatorsIds,
          })

          resolve(updated)

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
          ownerId: context.auth.userId,
          adminsIds: [],
          editorsIds: [],
          spectatorsIds: [],
        })

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
      authenticated(context, async (resolve) => {
        const index =
          args.index !== null && args.index !== undefined
            ? args.index
            : await Device.count({ where: { ownerId: context.auth.userId } })

        const newDevice = await Device.create({
          ...args,
          index,
          ownerId: context.auth.userId,
          adminsIds: [],
          editorsIds: [],
          spectatorsIds: [],
        })

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
          userId: context.auth.userId,
        })

        resolve(resolveValue)

        context.billingUpdater.update(MUTATION_COST)
      }),
    )
  },
  CreateFloatValue: CreateGenericValue(
    Device,
    Board,
    FloatValue,
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
  CreateStringValue: CreateGenericValue(
    Device,
    Board,
    StringValue,
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
  CreateBooleanValue: CreateGenericValue(
    Device,
    Board,
    BoolValue,
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
    Device,
    Board,
    ColourValue,
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
  CreateMapValue: CreateGenericValue(
    Device,
    Board,
    MapValue,
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
    Device,
    Board,
    PlotValue,
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
    Device,
    Board,
    StringPlotValue,
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
      authenticated(context, async (resolve, reject) => {
        const plot = await PlotValue.find({ where: { id: args.plotId } })

        if (!plot) {
          reject("This plot doesn't exist")
        } else if (plot.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const plotNode = await PlotNode.create({
            ...args,
            timestamp: args.timestamp || new Date(),
            deviceId: plot.deviceId,
            userId: context.auth.userId,
          })

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
            userId: context.auth.userId,
          })

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    )
  },
  CreateStringPlotNode(root, args, context) {
    return logErrorsPromise(
      'CreateStringPlotNode mutation',
      139,
      authenticated(context, async (resolve, reject) => {
        const plot = await StringPlotValue.find({ where: { id: args.plotId } })

        if (!plot) {
          reject("This plot doesn't exist")
        } else if (plot.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const plotNode = await StringPlotNode.create({
            ...args,
            timestamp: args.timestamp || new Date(),
            deviceId: plot.deviceId,
            userId: context.auth.userId,
          })

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
            userId: context.auth.userId,
          })
          context.billingUpdater.update(MUTATION_COST)
        }
      }),
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
        2,
        async (resolve, reject, boardFound) => {
          const newBoard = await boardFound.update(args)

          resolve(newBoard.dataValues)
          pubsub.publish('boardUpdated', {
            boardUpdated: newBoard.dataValues,
            userId: context.auth.userId,
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
        2,
        async (resolve, reject, deviceFound) => {
          const newDevice = await deviceFound.update(args)
          resolve(newDevice.dataValues)
          pubsub.publish('deviceUpdated', {
            deviceUpdated: newDevice.dataValues,
            userId: context.auth.userId,
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
    Device,
    Board,
  ),
  stringValue: genericValueMutation(
    StringValue,
    'StringValue',
    pubsub,
    Device,
    Board,
  ),
  booleanValue: genericValueMutation(
    BoolValue,
    'BooleanValue',
    pubsub,
    Device,
    Board,
  ),
  colourValue: genericValueMutation(
    ColourValue,
    'ColourValue',
    pubsub,
    Device,
    Board,
  ),
  mapValue: genericValueMutation(MapValue, 'MapValue', pubsub, Device, Board),
  plotValue: genericValueMutation(
    PlotValue,
    'PlotValue',
    pubsub,
    Device,
    Board,
  ),
  stringPlotValue: genericValueMutation(
    StringPlotValue,
    'StringPlotValue',
    pubsub,
    Device,
    Board,
  ),
  plotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      authenticated(context, async (resolve, reject) => {
        const node = await PlotNode.find({ where: { id: args.id } })

        if (!node) {
          reject("This node doesn't exist")
        } else if (node.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const newNode = await node.update(args)

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
            userId: context.auth.userId,
          })

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    )
  },
  stringPlotNode(root, args, context) {
    return logErrorsPromise(
      'stringPlotNode mutation',
      139,
      authenticated(context, async (resolve, reject) => {
        const node = await StringPlotNode.find({ where: { id: args.id } })

        if (!node) {
          reject("This node doesn't exist")
        } else if (node.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const newNode = await node.update(args)

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
            userId: context.auth.userId,
          })

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
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
        2,
        async (resolve, reject, deviceFound) => {
          const newNotification = await Notification.create({
            ...args,
            visualized: false,
            snackbarVisualized: false,
            userId: context.auth.userId,
            date: args.date || new Date(),
          })

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
          pubsub.publish('notificationCreated', {
            notificationCreated: resolveValue,
            userId: context.auth.userId,
          })

          // the notificationsCount props are updated so send the device and board subscriptions
          pubsub.publish('deviceUpdated', {
            deviceUpdated: {
              id: deviceId,
            },
            userId: context.auth.userId,
          })
          if (deviceFound.boardId) {
            pubsub.publish('boardUpdated', {
              boardUpdated: {
                id: deviceFound.boardId,
              },
              userId: context.auth.userId,
            })
          }
          context.billingUpdater.update(MUTATION_COST)

          if (!userFound.quietMode) {
            const notificationSubscriptions = await WebPushSubscription.findAll({
              where: { userId: context.auth.userId },
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
  notification(root, args, context) {
    return logErrorsPromise(
      'notification mutation',
      123,
      authenticated(context, async (resolve, reject) => {
        const notificationFound = await Notification.find({
          where: { id: args.id },
        })

        if (!notificationFound) {
          reject('The requested resource does not exist')
        } else if (notificationFound.userId !== context.auth.userId) {
          reject('You are not allowed to update this resource')
        } else {
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

          pubsub.publish('notificationUpdated', {
            notificationUpdated: resolveValue,
            userId: context.auth.userId,
          })
          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    )
  },
  deleteNotification: genericDelete(
    Notification,
    'notificationDeleted',
    pubsub,
  ),
  deleteValue: (root, args, context) =>
    logErrorsPromise(
      'delete mutation',
      124,
      authenticated(context, async (resolve, reject) => {
        // TODO: remove also plotnodes with PlotValues
        const modelsList = [
          FloatValue,
          StringValue,
          ColourValue,
          BoolValue,
          PlotValue,
          StringPlotValue,
          MapValue,
        ]
        for (let i = 0; i < modelsList.length; i++) {
          const Model = modelsList[i]
          const entityFound = await Model.find({
            where: { id: args.id },
          })

          if (entityFound && entityFound.userId === context.auth.userId) {
            await entityFound.destroy()

            pubsub.publish('valueDeleted', {
              valueDeleted: args.id,
              userId: context.auth.userId,
            })
            resolve(args.id)
            context.billingUpdater.update(MUTATION_COST)

            return
          } else if (
            entityFound &&
            entityFound.userId !== context.auth.userId
          ) {
            reject('You are not allowed to update this resource')
          }
        }

        reject('The requested resource does not exist')
      }),
    ),
  deleteDevice: (root, args, context) =>
    logErrorsPromise(
      'delete device mutation',
      126,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: args.id },
        })

        if (!deviceFound) {
          reject('The requested resource does not exist')
        } else if (deviceFound.userId !== context.auth.userId) {
          reject('You are not allowed to update this resource')
        } else {
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
            Notification,
          ].map(deleteChild))

          await deviceFound.destroy()

          pubsub.publish('deviceDeleted', {
            deviceDeleted: args.id,
            userId: context.auth.userId,
          })
          resolve(args.id)
          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    ),
  deleteBoard: (root, args, context) =>
    logErrorsPromise(
      'delete board mutation',
      913,
      authenticated(context, async (resolve, reject) => {
        const boardFound = await Board.find({
          where: { id: args.id },
        })

        if (!boardFound) {
          reject('The requested resource does not exist')
        } else if (boardFound.userId !== context.auth.userId) {
          reject('You are not allowed to update this resource')
        } else {
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
            userId: context.auth.userId,
          })
          resolve(args.id)

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    ),
  deletePlotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      authenticated(context, async (resolve, reject) => {
        const node = await PlotNode.find({ where: { id: args.id } })

        if (!node) {
          reject("This node doesn't exist")
        } else if (node.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const newNode = await node.destroy()

          resolve(args.id)
          pubsub.publish('plotNodeDeleted', {
            plotNodeDeleted: args.id,
            userId: context.auth.userId,
          })

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
    )
  },
  deleteStringPlotNode(root, args, context) {
    return logErrorsPromise(
      'CreatePlotNode mutation',
      139,
      authenticated(context, async (resolve, reject) => {
        const node = await StringPlotNode.find({ where: { id: args.id } })

        if (!node) {
          reject("This node doesn't exist")
        } else if (node.userId !== context.auth.userId) {
          reject('You are not authorized to edit this plot')
        } else {
          const newNode = await node.destroy()

          resolve(args.id)
          pubsub.publish('stringPlotNodeDeleted', {
            stringPlotNodeDeleted: args.id,
            userId: context.auth.userId,
          })

          context.billingUpdater.update(MUTATION_COST)
        }
      }),
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
