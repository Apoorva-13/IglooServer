const Sequelize = require('sequelize')

const databaseDefinition = (sequelize) => {
  const ValuePermission = Sequelize.ENUM('READ_ONLY', 'READ_WRITE')
  const ValueRelevance = Sequelize.ENUM('VISIBLE', 'HIDDEN', 'INVISIBLE')
  const TileSize = Sequelize.ENUM('NORMAL', 'WIDE', 'TALL', 'LARGE')
  const PaymentPlan = Sequelize.ENUM('FREE', 'PAYING')
  const selfId = {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
  }
  const otherId = (fieldName, model, allowNull = false) => ({
    [fieldName]: {
      type: Sequelize.UUID,
      allowNull,
      references: {
        model,
        key: 'id',
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
      },
    },
  })

  const User = sequelize.define('user', {
    ...selfId,
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    twoFactorSecret: {
      type: Sequelize.STRING,
    },
    language: {
      type: Sequelize.STRING,
    },
    timezone: {
      type: Sequelize.STRING,
    },
    quietMode: {
      type: Sequelize.BOOLEAN,
    },
    devMode: {
      type: Sequelize.BOOLEAN,
    },
    nightMode: {
      type: Sequelize.BOOLEAN,
    },
    stripeCustomerId: {
      type: Sequelize.STRING,
    },
    monthUsage: {
      type: Sequelize.INTEGER,
    },
    paymentPlan: {
      type: PaymentPlan,
    },
    usageCap: {
      type: Sequelize.INTEGER,
    },
    displayName: {
      type: Sequelize.STRING,
    },
    profileIcon: {
      type: Sequelize.STRING,
    },
    profileIconColor: {
      type: Sequelize.STRING,
    },
    emailIsVerified: {
      type: Sequelize.BOOLEAN,
    },
  })

  const Board = sequelize.define('board', {
    ...selfId,
    customName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    avatar: {
      type: Sequelize.STRING,
    },
    favorite: {
      type: Sequelize.ARRAY(Sequelize.UUID),
    },
    index: {
      type: Sequelize.INTEGER,
    },
    quietMode: {
      type: Sequelize.BOOLEAN,
    },
  })

  const PermanentToken = sequelize.define('permanentToken', {
    ...selfId,
    ...otherId('userId', User),
    customName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastUsed: {
      type: Sequelize.DATE,
    },
  })

  const WebPushSubscription = sequelize.define('webPushNotification', {
    ...selfId,
    ...otherId('userId', User),
    endpoint: {
      type: Sequelize.STRING(2000),
    },
    expirationTime: {
      type: Sequelize.DATE,
    },
    p256dh: {
      type: Sequelize.STRING,
    },
    auth: {
      type: Sequelize.STRING,
    },
  })

  const Device = sequelize.define('device', {
    ...selfId,
    deviceType: {
      type: Sequelize.STRING,
    },
    customName: {
      type: Sequelize.STRING,
    },
    icon: {
      type: Sequelize.STRING,
    },
    index: {
      type: Sequelize.INTEGER,
    },
    online: {
      type: Sequelize.BOOLEAN,
    },
    batteryStatus: {
      type: Sequelize.FLOAT,
    },
    batteryCharging: {
      type: Sequelize.BOOLEAN,
    },
    signalStatus: {
      type: Sequelize.FLOAT,
    },
    firmware: {
      type: Sequelize.STRING,
    },
  })

  const Notification = sequelize.define('notification', {
    ...selfId,
    ...otherId('userId', User),
    content: {
      type: Sequelize.STRING,
    },
    date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    visualized: {
      type: Sequelize.ARRAY(Sequelize.UUID),
    },
    snackbarVisualized: {
      type: Sequelize.ARRAY(Sequelize.UUID),
    },
  })

  const Value = {
    ...selfId,
    valueDetails: {
      type: Sequelize.STRING,
    },
    permission: {
      type: ValuePermission,
    },
    relevance: {
      type: ValueRelevance,
    },
    tileSize: {
      type: TileSize,
    },
    customName: {
      type: Sequelize.STRING,
    },
    index: {
      type: Sequelize.INTEGER,
    },
  }

  const BoolValue = sequelize.define('boolValue', {
    ...Value,
    value: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
  })
  const FloatValue = sequelize.define('floatValue', {
    ...Value,
    value: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    precision: {
      type: Sequelize.FLOAT,
    },
    boundaries: {
      type: Sequelize.ARRAY(Sequelize.FLOAT),
    },
  })
  const StringValue = sequelize.define('stringValue', {
    ...Value,
    value: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    maxChars: {
      type: Sequelize.INTEGER,
    },
    allowedValues: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
  })
  const PlotValue = sequelize.define('plotValue', {
    ...Value,
    precision: {
      type: Sequelize.FLOAT,
    },
    threshold: {
      type: Sequelize.FLOAT,
    },
    boundaries: {
      type: Sequelize.ARRAY(Sequelize.FLOAT),
    },
  })
  const PlotNode = sequelize.define('plotNode', {
    ...selfId,
    ...otherId('userId', User),
    ...otherId('deviceId', Device),
    ...otherId('plotId', PlotValue),
    value: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  })
  const StringPlotValue = sequelize.define('stringPlotValue', {
    ...Value,
    allowedValues: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
  })
  const StringPlotNode = sequelize.define('stringPlotNode', {
    ...selfId,
    ...otherId('userId', User),
    ...otherId('deviceId', Device),
    ...otherId('plotId', StringPlotValue),
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  })
  const MapValue = sequelize.define('mapValue', {
    ...Value,
    latitude: {
      type: Sequelize.FLOAT,
    },
    longitude: {
      type: Sequelize.FLOAT,
    },
    height: {
      type: Sequelize.FLOAT,
    },
    value: {
      type: Sequelize.TEXT,
    },
  })
  const ColourValue = sequelize.define('colourValue', {
    ...Value,
    value: {
      type: Sequelize.STRING,
    },
    allowedValues: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
  })

  Board.hasMany(Device)
  Device.belongsTo(Board)

  Device.hasMany(Notification)
  Notification.belongsTo(Device)

  PlotValue.hasMany(PlotNode)
  PlotNode.belongsTo(PlotValue, { as: 'plot' })

  StringPlotValue.hasMany(StringPlotNode)
  StringPlotNode.belongsTo(StringPlotValue, { as: 'plot' })

  const values = [
    BoolValue,
    FloatValue,
    StringValue,
    ColourValue,
    MapValue,
    PlotValue,
    StringPlotValue,
  ]
  values.forEach((Value) => {
    Device.hasMany(Value)
    Board.hasMany(Value)
  })

  // sets up all the OWNER, ADMIN, EDITOR, SPECTATOR relationships using a join table for the last 3
  const models = {
    Board,
    Device,
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    StringPlotValue,
    MapValue,
    ColourValue,
  }
  const modelNames = Object.keys(models)
  const modelObjects = Object.values(models)

  const associations = []
  const joinTables = {}
  for (let i = 0; i < modelNames.length; i++) {
    modelObjects[i].Owner = `Own${modelNames[i]}s`
    modelObjects[i].belongsTo(User, { as: 'owner' })
    User[`Own${modelNames[i]}s`] = User.hasMany(modelObjects[i], {
      as: `Own${modelNames[i]}s`,
    })

    const adminAssociation = sequelize.define(`${modelNames[i]}Admins`, {})
    associations.push(adminAssociation)
    joinTables[`${modelNames[i]}Admins`] = adminAssociation
    modelObjects[i].Admins = `Admin${modelNames[i]}s`
    modelObjects[i].belongsToMany(User, {
      as: 'admin',
      through: `${modelNames[i]}Admins`,
    })
    User[`Admin${modelNames[i]}s`] = User.belongsToMany(modelObjects[i], {
      through: `${modelNames[i]}Admins`,
      as: `Admin${modelNames[i]}s`,
    })

    const editorAssociation = sequelize.define(`${modelNames[i]}Editors`, {})
    joinTables[`${modelNames[i]}Editors`] = editorAssociation
    associations.push(editorAssociation)
    modelObjects[i].Editors = `Editor${modelNames[i]}s`
    modelObjects[i].belongsToMany(User, {
      as: 'editor',
      through: `${modelNames[i]}Editors`,
    })
    User[`Editor${modelNames[i]}s`] = User.belongsToMany(modelObjects[i], {
      as: `Editor${modelNames[i]}s`,
      through: `${modelNames[i]}Editors`,
    })

    const spectatorAssociation = sequelize.define(
      `${modelNames[i]}Spectators`,
      {},
    )
    joinTables[`${modelNames[i]}Spectators`] = spectatorAssociation
    associations.push(spectatorAssociation)
    modelObjects[i].Spectators = `Spectator${modelNames[i]}s`
    modelObjects[i].belongsToMany(User, {
      as: 'spectator',
      through: `${modelNames[i]}Spectators`,
    })
    User[`Spectator${modelNames[i]}s`] = User.belongsToMany(modelObjects[i], {
      as: `Spectator${modelNames[i]}s`,
      through: `${modelNames[i]}Spectators`,
    })
  }

  return {
    User,
    Board,
    PermanentToken,
    Device,
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColourValue,
    Notification,
    WebPushSubscription,
    StringPlotValue,
    StringPlotNode,
    associations,
    joinTables,
  }
}

module.exports = databaseDefinition
