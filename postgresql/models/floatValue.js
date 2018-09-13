const { ValueModel } = require('../modelUtilities')

module.exports = (queryInterface, Sequelize) => {
  const FloatValue = queryInterface.define('floatValue', {
    ...ValueModel(Sequelize),
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

  FloatValue.associate = function (models) {
    FloatValue.belongsTo(models.Device)
    Device.hasMany(FloatValue)

    FloatValue.belongsTo(models.Board)
    Board.hasMany(FloatValue)

    FloatValue.Owner = 'OwnFloatValues'
    FloatValue.belongsTo(models.User, { as: 'owner' })
    models.User.OwnFloatValues = User.hasMany(FloatValue, {
      as: 'OwnFloatValues',
    })
  }
  return FloatValue
}
