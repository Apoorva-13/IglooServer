module.exports = (queryInterface, Sequelize) => {
  const WebPushSubscription = queryInterface.define('webPushSubscription', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
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
  WebPushSubscription.associate = function (models) {
    WebPushSubscription.belongsTo(models.User)
    models.User.hasMany(WebPushSubscription)
  }
  return WebPushSubscription
}
