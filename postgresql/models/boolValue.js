const { ValueModel } = require('../modelUtilities')

module.exports = (queryInterface, Sequelize) => {
  const BoolValue = queryInterface.define('boolValue', {
    ...ValueModel(Sequelize),
    value: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
  })

  BoolValue.associate = function (models) {
    BoolValue.belongsTo(models.Device)
    Device.hasMany(BoolValue)

    BoolValue.belongsTo(models.Board)
    Board.hasMany(BoolValue)

    BoolValue.Owner = 'OwnBoolValues'
    BoolValue.belongsTo(models.User, { as: 'owner' })
    models.User.OwnBoolValues = User.hasMany(BoolValue, {
      as: 'OwnBoolValues',
    })
  }
  return BoolValue
}
