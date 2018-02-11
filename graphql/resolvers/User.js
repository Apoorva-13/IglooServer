import { authenticated, logErrorsPromise } from './utilities'

const retrieveUserScalarProp = prop => (root, args, context) =>
  logErrorsPromise(
    'retrieveScalarProp',
    106,
    authenticated(context, async (resolve, reject) => {
      /* istanbul ignore if - this should never be the case, so the error is not reproducible */
      if (context.auth.userId !== root.id) {
        reject('You are not allowed to access details about this user')
      } else {
        const userFound = await context.loaders.userLoader.find.load(root.id)
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
  email: retrieveUserScalarProp('email'),
  createdAt: retrieveUserScalarProp('createdAt'),
  updatedAt: retrieveUserScalarProp('updatedAt'),
  devices(root, args, context) {
    return logErrorsPromise(
      'User devices resolver',
      107,
      authenticated(context, async (resolve, reject) => {
        /* istanbul ignore if - this should never be the case, so the error is not reproducible */
        if (context.auth.userId !== root.id) {
          reject('You are not allowed to access details about this user')
        } else {
          const devices = await context.loaders.deviceLoader.findAllByUserId.load(root.id)

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
          const notifications = await context.loaders.notificationLoader.findAllByUserId.load(root.id)
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
          const values = await Value.findAll({
            where: { userId: root.id },
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
          resolve(values.map((value) => {
            if (value.dataValues.childFloat) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const floatValueDate = +new Date(value.dataValues.childFloat.dataValues.updatedAt)

              return {
                ...value.dataValues.childFloat.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > floatValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childFloat.dataValues.updatedAt,
                __resolveType: 'FloatValue',
              }
            } else if (value.dataValues.childString) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const stringValueDate = +new Date(value.dataValues.childString.dataValues.updatedAt)

              return {
                ...value.dataValues.childString.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > stringValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childString.dataValues.updatedAt,
                __resolveType: 'StringValue',
              }
            } else if (value.dataValues.childBool) {
              const valueDate = +new Date(value.dataValues.updatedAt)
              const boolValueDate = +new Date(value.dataValues.childBool.dataValues.updatedAt)

              return {
                ...value.dataValues.childBool.dataValues,
                ...value.dataValues,
                updatedAt:
                    valueDate > boolValueDate
                      ? value.dataValues.updatedAt
                      : value.dataValues.childBool.dataValues.updatedAt,
                __resolveType: 'BooleanValue',
              }
            }
            const valueDate = +new Date(value.dataValues.updatedAt)
            const colourValueDate = +new Date(value.dataValues.childColour.dataValues.updatedAt)

            return {
              ...value.dataValues.childColour.dataValues,
              ...value.dataValues,
              updatedAt:
                  valueDate > colourValueDate
                    ? value.dataValues.updatedAt
                    : value.dataValues.childColour.dataValues.updatedAt,
              __resolveType: 'ColourValue',
            }
          }))
        }
      }),
    )
  },
})

export default UserResolver
