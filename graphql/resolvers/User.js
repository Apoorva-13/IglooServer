import { authenticated, logErrorsPromise, findAllValues } from './utilities'
import { Op } from 'sequelize'

const QUERY_COST = 1

const retrieveUserScalarProp = (User, prop, acceptedTokens) => (
  root,
  args,
  context,
) =>
  logErrorsPromise(
    'retrieveScalarProp',
    106,
    authenticated(
      context,
      async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const userFound = await User.find({ where: { id: root.id } })
          if (!userFound) {
            reject("User doesn't exist. Use `SignupUser` to create one")
          } else {
            resolve(userFound[prop])
          }
        }
      },
      acceptedTokens,
    ),
  )

const scalarProps = (User, props) =>
  props.reduce((acc, prop) => {
    acc[prop] = retrieveUserScalarProp(User, prop)
    return acc
  }, {})

const UserResolver = (
  User,
  PermanentToken,
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
  ...scalarProps(User, [
    'createdAt',
    'updatedAt',
    'quietMode',
    'language',
    'timezone',
    'devMode',
    'nightMode',
    'monthUsage',
    'emailIsVerified',
  ]),
  email: retrieveUserScalarProp(User, 'email', [
    'TEMPORARY',
    'PERMANENT',
    'PASSWORD_RECOVERY',
  ]),
  displayName: retrieveUserScalarProp(User, 'displayName', [
    'TEMPORARY',
    'PERMANENT',
    'PASSWORD_RECOVERY',
  ]),
  profileIcon: retrieveUserScalarProp(User, 'profileIcon', [
    'TEMPORARY',
    'PERMANENT',
    'PASSWORD_RECOVERY',
  ]),
  profileIconColor: retrieveUserScalarProp(User, 'profileIconColor', [
    'TEMPORARY',
    'PERMANENT',
    'PASSWORD_RECOVERY',
  ]),
  paymentPlan: retrieveUserScalarProp(User, 'paymentPlan', [
    'TEMPORARY',
    'PERMANENT',
    'SWITCH_TO_PAYING',
  ]),
  usageCap: retrieveUserScalarProp(User, 'usageCap', [
    'TEMPORARY',
    'PERMANENT',
    'CHANGE_USAGE_CAP',
  ]),
  devices(root, args, context) {
    return logErrorsPromise(
      'User devices resolver',
      107,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const devices = await Device.findAll({
            where: {
              [Op.or]: [
                { ownerId: root.id },
                { adminsIds: { [Op.contains]: [root.id] } },
                { editorsIds: { [Op.contains]: [root.id] } },
                { spectatorsIds: { [Op.contains]: [root.id] } },
              ],
            },
            order: [['index', 'ASC']],
          })

          resolve(devices)
          context.billingUpdater.update(QUERY_COST * devices.length)
        }
      }),
    )
  },
  boards(root, args, context) {
    return logErrorsPromise(
      'User boards resolver',
      904,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const boards = await Board.findAll({
            where: {
              [Op.or]: [
                { ownerId: root.id },
                { adminsIds: { [Op.contains]: [root.id] } },
                { editorsIds: { [Op.contains]: [root.id] } },
                { spectatorsIds: { [Op.contains]: [root.id] } },
              ],
            },
          })

          resolve(boards)
          context.billingUpdater.update(QUERY_COST * boards.length)
        }
      }),
    )
  },
  notifications(root, args, context) {
    return logErrorsPromise(
      'User devices resolver',
      119,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const notifications = await Notification.findAll({
            where: { userId: root.id },
          })
          resolve(notifications)
          context.billingUpdater.update(QUERY_COST * notifications.length)
        }
      }),
    )
  },
  values(root, args, context) {
    return logErrorsPromise(
      'User values resolver',
      108,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const values = await findAllValues(
            {
              BoolValue,
              FloatValue,
              StringValue,
              ColourValue,
              PlotValue,
              StringPlotValue,
              MapValue,
            },
            {
              where: { userId: root.id },
            },
            context.auth.userId,
          )

          resolve(values)
          context.billingUpdater.update(QUERY_COST * values.length)
        }
      }),
    )
  },
  permanentTokens(root, args, context) {
    return logErrorsPromise(
      'user permanentTokens',
      127,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const tokens = await PermanentToken.findAll({
            where: { userId: root.id },
          })

          resolve(tokens)
          context.billingUpdater.update(QUERY_COST * tokens.length)
        }
      }),
    )
  },
})

export default UserResolver
