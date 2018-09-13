const { ValueModel } = require('../modelUtilities')

module.exports = (queryInterface, Sequelize) => {
  const StringValue = queryInterface.define('stringValue', {
    ...ValueModel(Sequelize),
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

  StringValue.associate = function (models) {
    StringValue.belongsTo(models.Device)
    Device.hasMany(StringValue)

    StringValue.belongsTo(models.Board)
    Board.hasMany(StringValue)

    StringValue.Owner = 'OwnStringValues'
    StringValue.belongsTo(models.User, { as: 'owner' })
    models.User.OwnStringValues = User.hasMany(StringValue, {
      as: 'OwnStringValues',
    })
  }
  return StringValue
}
