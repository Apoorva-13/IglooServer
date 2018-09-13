const ValueModel = Sequelize => ({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  valueDetails: {
    type: Sequelize.STRING,
  },
  permission: {
    type: ValuePermission,
  },
  relevance: {
    type: ValueRelevance,
  },
  tileSize: {
    type: TileSize,
  },
  customName: {
    type: Sequelize.STRING,
  },
  index: {
    type: Sequelize.INTEGER,
  },
})

module.exports = {
  ValueModel,
}
