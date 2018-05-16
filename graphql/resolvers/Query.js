import { authenticated, logErrorsPromise, findValue } from './utilities'
import bcrypt from 'bcryptjs'

const QueryResolver = (
  User,
  Device,
  Value,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
) => ({
  user(root, args, context) {
    return new Promise(authenticated(context, (resolve) => {
      resolve({ id: context.auth.userId })
    }))
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
            tags,
            deviceType,
            userId,
          } = deviceFound
          resolve({
            id,
            updatedAt,
            createdAt,
            customName,
            tags,
            deviceType,
            user: {
              id: userId,
            },
          })
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
          },
          { where: { id: args.id } },
          context.auth.userId,
        ).catch(e => reject(e))

        resolve(valueFound)
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
})

export default QueryResolver
