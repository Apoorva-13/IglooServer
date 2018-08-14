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
    ...otherId('userId', User),
    customName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    avatar: {
      type: Sequelize.STRING,
    },
    favorite: {
      type: Sequelize.BOOLEAN,
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
    ...otherId('userId', User),
    ...otherId('boardId', Board, true),
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
  })

  const Notification = sequelize.define('notification', {
    ...selfId,
    ...otherId('userId', User),
    ...otherId('deviceId', Device),
    content: {
      type: Sequelize.STRING,
    },
    date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    visualized: {
      type: Sequelize.BOOLEAN,
    },
    snackbarVisualized: {
      type: Sequelize.BOOLEAN,
    },
  })

  const Value = {
    ...selfId,
    ...otherId('userId', User),
    ...otherId('deviceId', Device),
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
  }
}

module.exports = databaseDefinition
