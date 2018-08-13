import { authenticated, logErrorsPromise, findValue } from './utilities'
import bcrypt from 'bcryptjs'

const QUERY_COST = 1

const QueryResolver = (
  User,
  Device,
  Board,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
  PlotValue,
  StringPlotValue,
  MapValue,
  Notification,
) => ({
  user(root, args, context) {
    return new Promise(authenticated(
      context,
      (resolve) => {
        resolve({ id: context.auth.userId })
        context.billingUpdater.update(QUERY_COST)
      },
      ['TEMPORARY', 'PERMANENT', 'PASSWORD_RECOVERY'],
    ))
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
            deviceType,
            userId,
          } = deviceFound
          resolve({
            id,
            updatedAt,
            createdAt,
            customName,
            deviceType,
            user: {
              id: userId,
            },
          })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  board(root, args, context) {
    return logErrorsPromise(
      'board query',
      912,
      authenticated(context, async (resolve, reject) => {
        const boardFound = await Board.find({
          where: { id: args.id },
        })
        if (!boardFound) {
          reject('The requested resource does not exist')
        } else if (boardFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else {
          resolve({
            ...boardFound.dataValues,
            user: {
              id: boardFound.userId,
            },
          })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  value(root, args, context) {
    return logErrorsPromise(
      'value query',
      114,
      authenticated(context, async (resolve, reject) => {
        const valueFound = await findValue(
          {
            BoolValue,
            FloatValue,
            StringValue,
            ColourValue,
            PlotValue,
            StringPlotValue,
            MapValue,
          },
          { where: { id: args.id } },
          context.auth.userId,
        ).catch(e => reject(e))

        resolve(valueFound)
        context.billingUpdater.update(QUERY_COST)
      }),
    )
  },
  verifyPassword(root, args, context) {
    return logErrorsPromise(
      'verifyPassword',
      178,
      authenticated(context, async (resolve, reject) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })

        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (
          bcrypt.compareSync(args.password, userFound.dataValues.password)
        ) {
          resolve(true)
        } else {
          resolve(false)
        }
      }),
    )
  },
  notification(root, args, context) {
    return logErrorsPromise(
      'notificationQuery',
      300,
      authenticated(context, async (resolve, reject) => {
        const notificationFound = await Notification.find({
          where: { id: args.id },
        })
        if (!notificationFound) {
          reject('The requested resource does not exist')
        } else if (notificationFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else {
          resolve(notificationFound)
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
})

export default QueryResolver
