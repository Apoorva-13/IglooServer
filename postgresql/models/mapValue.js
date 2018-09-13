const { ValueModel } = require('../modelUtilities')

module.exports = (queryInterface, Sequelize) => {
  const MapValue = queryInterface.define('mapValue', {
    ...ValueModel(Sequelize),
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

  MapValue.associate = function (models) {
    MapValue.belongsTo(models.Device)
    Device.hasMany(MapValue)

    MapValue.belongsTo(models.Board)
    Board.hasMany(MapValue)

    MapValue.Owner = 'OwnMapValues'
    MapValue.belongsTo(models.User, { as: 'owner' })
    models.User.OwnMapValues = User.hasMany(MapValue, {
      as: 'OwnMapValues',
    })
  }
  return MapValue
}
