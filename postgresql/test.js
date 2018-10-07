import {
  Board,
  Device,
  User,
  FloatValue,
  joinTables,
} from './databaseConnection'

async function getAllUsers(modelFound) {
  const owner = await modelFound.getOwner()
  const admins = await modelFound.getAdmin()
  const editors = await modelFound.getEditor()
  const spectators = await modelFound.getSpectator()

  return [owner, ...admins, ...editors, ...spectators].map(user => user.id)
}

async function getAll(Model, User, userId, includesList = []) {
  // for some reason sequelize needs the includes to be different instances,
  // so we shallow clone every include object
  const allAccessibles = await User.find({
    where: { id: userId },
    attributes: ['id'],
    include: [
      {
        model: Model,
        as: Model.Owner,
        attributes: ['id'],
        include: includesList.map(({ ...args }) => ({ ...args })),
      },
      {
        model: Model,
        as: Model.Admins,
        attributes: ['id'],
        include: includesList.map(({ ...args }) => ({ ...args })),
      },
      {
        model: Model,
        as: Model.Editors,
        attributes: ['id'],
        include: includesList.map(({ ...args }) => ({ ...args })),
      },
      {
        model: Model,
        as: Model.Spectators,
        attributes: ['id'],
        include: includesList.map(({ ...args }) => ({ ...args })),
      },
    ],
  })

  const allFlattened = [
    ...allAccessibles[Model.Owner],
    ...allAccessibles[Model.Admins],
    ...allAccessibles[Model.Editors],
    ...allAccessibles[Model.Spectators],
  ]

  return allFlattened
}

async function instanceAuthorizationLevel(userFound, instance) {
  const modelNameLowerCase = instance._modelOptions.name.singular
  const ModelName =
    modelNameLowerCase[0].toUpperCase() + modelNameLowerCase.slice(1)

  const isOwner = await userFound[`hasOwn${ModelName}`](instance)
  const isAdmin = await userFound[`hasAdmin${ModelName}`](instance)
  const isEditor = await userFound[`hasEditor${ModelName}`](instance)
  const isSpectator = await userFound[`hasSpectator${ModelName}`](instance)

  if (isOwner) return 4
  else if (isAdmin) return 3
  else if (isEditor) return 2
  else if (isSpectator) return 1
  return 0
}

(async () => {
  const userFound = await User.find({ where: { email: '99.zanin@gmail.com' } })

  const newDevice = await Device.create({
    customName: 'test',
    index: 0,
    permission: 'READ_WRITE',
    visibility: 'VISIBLE',
    ownerId: userFound.id,
  })

  await userFound.addOwnDevices(newDevice)

  await userFound.removeOwnDevices(newDevice)
  const newDevice2 = await Device.create({
    customName: 'test',
    index: 0,
    permission: 'READ_WRITE',
    visibility: 'VISIBLE',
    ownerId: userFound.id,
  })

  await userFound.addAdminDevices(newDevice2)

  console.log(await getAllUsers(newDevice2))

  return
  const admins = await joinTables.DeviceAdmins.findAll({
    where: { userId: userFound.id },
  })
  console.log(admins.map(admin => admin.dataValues))

  console.log(await instanceAuthorizationLevel(userFound, newDevice2))

  const myDevicesFlatten = await getAll(Device, User, userFound.id, [
    { model: FloatValue },
  ])
  console.log(myDevicesFlatten.map(({ id, floatValues }) => ({ id, floatValues })))

  const newFloat = await FloatValue.create({
    customName: 'test',
    index: 0,
    value: 44,
    permission: 'READ_WRITE',
    visibility: 'VISIBLE',
    ownerId: userFound.id,
    adminsIds: [],
    editorsIds: [],
    spectatorsIds: [],
  })

  await newDevice.addFloatValue(newFloat)

  const userDevicesFound = await User.find({
    where: { email: '99.zanin@gmail.com' },
    attributes: ['id'],
    include: [
      {
        model: Device,
        as: 'AdminDevices',
        attributes: ['id'],
        include: [{ model: FloatValue }],
      },
    ],
  })

  //   console.log(userDevicesFound.dataValues.AdminDevices.map(device => device.dataValues.floatValues))

  process.exit(0)
})().catch((e) => {
  console.log(e)
  process.exit(1)
})
