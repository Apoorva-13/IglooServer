import {
  authenticated,
  generateAuthenticationToken,
  CreateGenericValue,
  genericValueMutation,
  create2FSecret,
  check2FCode,
  logErrorsPromise,
} from "./utilities.js"
import bcrypt from "bcryptjs"
import OTP from "otp.js"

const SALT_ROUNDS = 10

const MutationResolver = (
  User,
  Device,
  Value,
  FloatValue,
  StringValue,
  BoolValue,
  ColourValue,
  pubsub,
  JWT_SECRET,
) => ({
  // checks if the user exists, if so
  // compares the given password with the hash
  // and returns an access token
  AuthenticateUser(root, args) {
    return logErrorsPromise(
      "AuthenticateUser",
      103,
      async (resolve, reject) => {
        const userFound = await User.find({ where: { email: args.email } })
        if (!userFound) {
          reject("User doesn't exist. Use `SignupUser` to create one")
        } else if (
          !bcrypt.compareSync(args.password, userFound.dataValues.password)
        ) {
          reject("Wrong password")
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
          reject("Wrong or missing 2-Factor Authentication Code")
        }
      },
    )
  },
  // checks if a user with that email already exists
  // if not it creates one and returnes an access token
  SignupUser(root, args) {
    return logErrorsPromise("SignupUser", 102, async (resolve, reject) => {
      const user = await User.find({ where: { email: args.email } })
      if (user) {
        reject("A user with this email already exists")
      } else {
        const encryptedPass = bcrypt.hashSync(args.password, SALT_ROUNDS)

        User.create({
          email: args.email,
          password: encryptedPass,
        }).then((newUser) => {
          resolve({
            id: newUser.dataValues.id,
            token: generateAuthenticationToken(
              newUser.dataValues.id,
              JWT_SECRET,
            ),
          })
        })
      }
    })
  },
  UpgradeTo2FactorAuthentication(root, args, context) {
    return logErrorsPromise(
      "UpgradeTo2FactorAuthentication",
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
            "igloo",
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
      "ChangePassword",
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
      "CreateDevice",
      104,
      authenticated(context, async (resolve) => {
        const newDevice = await Device.create({
          customName: args.customName,
          deviceType: args.deviceType,
          tags: args.tags,
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
          user: {
            id: userId,
          },
        }

        pubsub.publish("deviceCreated", {
          deviceCreated: resolveValue,
          userId: context.auth.userId,
        })

        resolve(resolveValue)
      }),
    )
  },
  CreateFloatValue: CreateGenericValue(
    Device,
    Value,
    ["precision", "boundaries"],
    "childFloat",
    FloatValue,
    pubsub,
  ),
  CreateStringValue: CreateGenericValue(
    Device,
    Value,
    ["maxChars"],
    "childString",
    StringValue,
    pubsub,
  ),
  CreateBooleanValue: CreateGenericValue(
    Device,
    Value,
    [],
    "childBool",
    BoolValue,
    pubsub,
  ),
  CreateColourValue: CreateGenericValue(
    Device,
    Value,
    [],
    "childColour",
    ColourValue,
    pubsub,
  ),
  user(root, args, context) {
    return logErrorsPromise(
      "user mutation",
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

          pubsub.publish("userUpdated", {
            userUpdated: newUser.dataValues,
            userId: context.auth.userId,
          })
        }
      }),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      "device mutation",
      116,
      authenticated(context, async (resolve, reject) => {
        const deviceFound = await Device.find({
          where: { id: args.id },
        })
        if (!deviceFound) {
          reject("Device doesn't exist. Use `CreateDevice` to create one")
        } else if (deviceFound.userId !== context.auth.userId) {
          reject("You are not allowed to access details about this resource")
        } else {
          const newDevice = await deviceFound.update(args)
          resolve(newDevice.dataValues)
          pubsub.publish("deviceUpdated", {
            deviceUpdated: newDevice.dataValues,
            userId: context.auth.userId,
          })
        }
      }),
    )
  },
  floatValue: genericValueMutation(
    Value,
    ["boundaries", "precision"],
    "childFloatId",
    FloatValue,
    pubsub,
  ),
  stringValue: genericValueMutation(
    Value,
    ["maxChars"],
    "childStringId",
    StringValue,
    pubsub,
  ),
  booleanValue: genericValueMutation(
    Value,
    [],
    "childBoolId",
    BoolValue,
    pubsub,
  ),
  colourValue: genericValueMutation(
    Value,
    [],
    "childColourId",
    ColourValue,
    pubsub,
  ),
})

export default MutationResolver
