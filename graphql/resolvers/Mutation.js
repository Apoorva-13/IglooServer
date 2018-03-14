import bcrypt from 'bcryptjs'
import OTP from 'otp.js'
import {
  authenticated,
  generateAuthenticationToken,
  CreateGenericValue,
  genericValueMutation,
  create2FSecret,
  check2FCode,
  logErrorsPromise,
  getPropsIfDefined,
  genericDelete,
} from './utilities'

const SALT_ROUNDS = 10

const MutationResolver = (
  User,
  Device,
  Value,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
  Notification,
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
          })

          resolve({
            id: newUser.dataValues.id,
            token: generateAuthenticationToken(
              newUser.dataValues.id,
              JWT_SECRET,
            ),
          })
        } catch (e) {
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
      authenticated(context, async (resolve, reject) => {
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
        }
      }),
    )
  },
  CreateDevice(root, args, context) {
    return logErrorsPromise(
      'CreateDevice',
      104,
      authenticated(context, async (resolve) => {
        const newDevice = await Device.create({
          customName: args.customName,
          deviceType: args.deviceType,
          tags: args.tags || [],
          icon: args.icon,
          userId: context.auth.userId,
        })
        const {
          id,
          createdAt,
          updatedAt,
          deviceType,
          customName,
          userId,
          tags,
          icon,
        } = newDevice.dataValues
        const values = [] // values cannot be set when creating the device so no need to fetch them

        const resolveValue = {
          id,
          createdAt,
          updatedAt,
          deviceType,
          customName,
          tags,
          values,
          icon,
          user: {
            id: userId,
          },
        }

        pubsub.publish('deviceCreated', {
          deviceCreated: resolveValue,
          userId: context.auth.userId,
        })

        resolve(resolveValue)
      }),
    )
  },
  CreateFloatValue: CreateGenericValue(Device, FloatValue, pubsub),
  CreateStringValue: CreateGenericValue(Device, StringValue, pubsub),
  CreateBooleanValue: CreateGenericValue(Device, BoolValue, pubsub),
  CreateColourValue: CreateGenericValue(Device, ColourValue, pubsub),
  user(root, args, context) {
    return logErrorsPromise(
      'user mutation',
      115,
      authenticated(context, async (resolve, reject) => {
        const userFound = await User.find({
          where: { id: context.auth.userId },
        })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else {
          const newUser = await userFound.update({
            email: args.email,
          })
          resolve(newUser.dataValues)

          pubsub.publish('userUpdated', {
            userUpdated: newUser.dataValues,
            userId: context.auth.userId,
          })
        }
      }),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      'device mutation',
      116,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: args.id },
        })
        if (!deviceFound) {
          reject("Device doesn't exist. Use `CreateDevice` to create one")
        } else if (deviceFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else {
          const newDevice = await deviceFound.update(args)
          resolve(newDevice.dataValues)
          pubsub.publish('deviceUpdated', {
            deviceUpdated: newDevice.dataValues,
            userId: context.auth.userId,
          })
        }
      }),
    )
  },
  floatValue: genericValueMutation(
    Value,
    ['boundaries', 'precision'],
    'childFloatId',
    FloatValue,
    'FloatValue',
    pubsub,
  ),
  stringValue: genericValueMutation(
    Value,
    ['maxChars'],
    'childStringId',
    StringValue,
    'StringValue',
    pubsub,
  ),
  booleanValue: genericValueMutation(
    Value,
    [],
    'childBoolId',
    BoolValue,
    'BooleanValue',
    pubsub,
  ),
  colourValue: genericValueMutation(
    Value,
    [],
    'childColourId',
    ColourValue,
    'ColourValue',
    pubsub,
  ),
  CreateNotification(root, args, context) {
    return logErrorsPromise(
      'create notification mutation',
      122,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: args.deviceId },
        })
        if (!deviceFound) {
          reject("Device doesn't exist. Use `CreateDevice` to create one")
        } else if (deviceFound.userId !== context.auth.userId) {
          reject('You are not allowed to access details about this resource')
        } else {
          const newNotification = await Notification.create({
            ...args,
            visualized: false,
            snackbarVisualized: false,
            userId: context.auth.userId,
            date: new Date(),
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
        }
      }),
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
        }
      }),
    )
  },
  deleteNotification: genericDelete(
    Notification,
    'notificationDeleted',
    pubsub,
  ),
  deleteFloatValue: genericDelete(FloatValue, 'valueDeleted', pubsub),
  deleteStringValue: genericDelete(StringValue, 'valueDeleted', pubsub),
  deleteBooleanValue: genericDelete(BoolValue, 'valueDeleted', pubsub),
  deleteColourValue: genericDelete(ColourValue, 'valueDeleted', pubsub),
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

          await Promise.all([FloatValue, StringValue, ColourValue, BoolValue, Notification].map(deleteChild))

          await deviceFound.destroy()

          pubsub.publish('deviceDeleted', {
            deviceDeleted: args.id,
            userId: context.auth.userId,
          })
          resolve(args.id)
        }
      }),
    ),
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
