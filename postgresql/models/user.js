module.exports = (queryInterface, Sequelize) => {
  const PaymentPlan = Sequelize.ENUM('FREE', 'PAYING')

  const User = queryInterface.define('user', {
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
  User.associate = function (models) {
    // associations can be defined here
  }
  return User
}
