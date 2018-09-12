module.exports = (queryInterface, Sequelize) => {
  const Board = queryInterface.define('board', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    customName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    avatar: {
      type: Sequelize.STRING,
    },
    favorite: {
      type: Sequelize.BOOLEAN,
    },
    index: {
      type: Sequelize.INTEGER,
    },
    quietMode: {
      type: Sequelize.BOOLEAN,
    },
  })
  Board.associate = function (models) {
    // associations can be defined here
  }
  return Board
}
