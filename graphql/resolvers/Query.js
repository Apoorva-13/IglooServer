import {
  authenticated,
  logErrorsPromise,
  findValue,
  authorized,
  deviceToParents,
} from './utilities'
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
      authorized(
        args.id,
        context,
        Device,
        1,
        async (resolve, reject, deviceFound) => {
          resolve(deviceFound.dataValues)

          context.billingUpdater.update(QUERY_COST)
        },
        deviceToParents(Board),
      ),
    )
  },
  board(root, args, context) {
    return logErrorsPromise(
      'board query',
      912,
      authorized(
        args.id,
        context,
        Board,
        1,
        async (resolve, reject, boardFound) => {
          resolve(boardFound.dataValues)
          context.billingUpdater.update(QUERY_COST)
        },
      ),
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
