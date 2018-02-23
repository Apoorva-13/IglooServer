import { authenticated, logErrorsPromise, findAllValues } from './utilities'

const retrieveUserScalarProp = (User, prop) => (root, args, context) =>
  logErrorsPromise(
    'retrieveScalarProp',
    106,
    authenticated(context, async (resolve, reject) => {
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
    }),
  )

const UserResolver = (
  User,
  Device,
  Value,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
  Notification,
) => ({
  email: retrieveUserScalarProp(User, 'email'),
  createdAt: retrieveUserScalarProp(User, 'createdAt'),
  updatedAt: retrieveUserScalarProp(User, 'updatedAt'),
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
            where: { userId: root.id },
          })

          resolve(devices)
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
          resolve(findAllValues(
            {
              BoolValue,
              FloatValue,
              StringValue,
              ColourValue,
            },
            {
              where: { userId: root.id },
            },
            context.auth.userId,
          ))
        }
      }),
    )
  },
})

export default UserResolver
