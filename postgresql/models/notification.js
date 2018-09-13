module.exports = (queryInterface, Sequelize) => {
  const Notification = queryInterface.define('notification', {
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

  Notification.associate = function (models) {
    Notification.belongsTo(models.User)
    models.User.hasMany(Notification)
  }
  return Notification
}
