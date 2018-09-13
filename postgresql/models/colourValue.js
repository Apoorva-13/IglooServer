const { ValueModel } = require('../modelUtilities')

module.exports = (queryInterface, Sequelize) => {
  const ColourValue = queryInterface.define('colourValue', {
    ...ValueModel(Sequelize),
    value: {
      type: Sequelize.STRING,
    },
    allowedValues: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
  })

  ColourValue.associate = function (models) {
    ColourValue.belongsTo(models.Device)
    Device.hasMany(ColourValue)

    ColourValue.belongsTo(models.Board)
    Board.hasMany(ColourValue)

    ColourValue.Owner = 'OwnColourValues'
    ColourValue.belongsTo(models.User, { as: 'owner' })
    models.User.OwnColourValues = User.hasMany(ColourValue, {
      as: 'OwnColourValues',
    })
  }
  return ColourValue
}
