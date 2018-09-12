module.exports = (queryInterface, Sequelize) => {
  const PermanentToken = queryInterface.define('permanentToken', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    customName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastUsed: {
      type: Sequelize.DATE,
    },
  })
  PermanentToken.associate = function (models) {
    PermanentToken.belongsTo(models.User)
    models.User.hasMany(PermanentToken)
  }
  return PermanentToken
}
