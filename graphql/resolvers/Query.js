import {
  authenticated,
  logErrorsPromise,
  findValue,
  authorized,
  deviceToParents,
  notificationToParent,
  inheritAuthorized,
} from './utilities'
import bcrypt from 'bcryptjs'

const QUERY_COST = 1

const QueryResolver = ({
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
}) => ({
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
        User,
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
        User,
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
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
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
          Device,
          Board,
          { where: { id: args.id } },
          userFound,
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
      inheritAuthorized(
        args.id,
        Notification,
        User,
        notificationFound => notificationFound.deviceId,
        context,
        Device,
        1,
        async (resolve, reject, notificationFound) => {
          resolve(notificationFound)
          context.billingUpdater.update(QUERY_COST)
        },
        deviceToParents(Board),
      ),
    )
  },
})

export default QueryResolver
