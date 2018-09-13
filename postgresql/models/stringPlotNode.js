module.exports = (queryInterface, Sequelize) => {
  const StringPlotNode = queryInterface.define('stringPlotNode', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  })

  StringPlotNode.associate = function (models) {
    StringPlotNode.belongsTo(models.User)
    models.User.hasMany(StringPlotNode)

    StringPlotNode.belongsTo(models.Device)
    models.Device.hasMany(StringPlotNode)

    StringPlotNode.belongsTo(models.StringPlotValue, { as: 'plot' })
    models.StringPlotValue.hasMany(StringPlotNode)
  }
  return PlotNode
}
