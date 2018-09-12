module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    await queryInterface.createTable('devices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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

    await queryInterface.createTable('boards', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users')
    await queryInterface.dropTable('boards')
    await queryInterface.dropTable('devices')
    await queryInterface.dropTable('permanentTokens')
    await queryInterface.dropTable('webPushSubscriptions')
  },
}
