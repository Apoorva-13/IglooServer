module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ValuePermission = Sequelize.ENUM('READ_ONLY', 'READ_WRITE')
    const ValueRelevance = Sequelize.ENUM('VISIBLE', 'HIDDEN', 'INVISIBLE')
    const TileSize = Sequelize.ENUM('NORMAL', 'WIDE', 'TALL', 'LARGE')
    const PaymentPlan = Sequelize.ENUM('FREE', 'PAYING')

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
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

    await queryInterface.createTable('boards', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    await queryInterface.createTable('devices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      boardId: {
        type: Sequelize.UUID,
        references: {
          model: 'boards', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    await queryInterface.createTable('permanentTokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      customName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastUsed: {
        type: Sequelize.DATE,
      },
    })

    await queryInterface.createTable('webPushSubscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'devices', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    await queryInterface.createTable('boolValues', {
      ...Value,
      value: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    })
    await queryInterface.createTable('floatValues', {
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
    await queryInterface.createTable('stringValues', {
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
    await queryInterface.createTable('plotValues', {
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
    await queryInterface.createTable('plotNodes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'devices', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      plotId: {
        type: Sequelize.UUID,
        references: {
          model: 'plotValues', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })
    await queryInterface.createTable('stringPlotValues', {
      ...Value,
      allowedValues: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
    })
    await queryInterface.createTable('stringPlotNodes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'devices', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      plotId: {
        type: Sequelize.UUID,
        references: {
          model: 'stringPlotValues', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })
    await queryInterface.createTable('mapValues', {
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
    await queryInterface.createTable('colourValues', {
      ...Value,
      value: {
        type: Sequelize.STRING,
      },
      allowedValues: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users')
    await queryInterface.dropTable('boards')
    await queryInterface.dropTable('devices')
    await queryInterface.dropTable('permanentTokens')
    await queryInterface.dropTable('webPushSubscriptions')
    await queryInterface.dropTable('notifications')
    await queryInterface.dropTable('floatValues')
    await queryInterface.dropTable('stringValues')
    await queryInterface.dropTable('boolValues')
    await queryInterface.dropTable('colourValues')
    await queryInterface.dropTable('mapValues')
    await queryInterface.dropTable('plotValues')
    await queryInterface.dropTable('stringPlotValues')
    await queryInterface.dropTable('plotNodes')
    await queryInterface.dropTable('stringPlotNodes')
  },
}
