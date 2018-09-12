module.exports = (queryInterface, Sequelize) => {
  const Device = queryInterface.define('device', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    deviceType: {
      type: Sequelize.STRING,
    },
    customName: {
      type: Sequelize.STRING,
    },
    icon: {
      type: Sequelize.STRING,
    },
    index: {
      type: Sequelize.INTEGER,
    },
    online: {
      type: Sequelize.BOOLEAN,
    },
    batteryStatus: {
      type: Sequelize.FLOAT,
    },
    batteryCharging: {
      type: Sequelize.BOOLEAN,
    },
    signalStatus: {
      type: Sequelize.FLOAT,
    },
    firmware: {
      type: Sequelize.STRING,
    },
  })
  Device.associate = function (models) {
    // associations can be defined here
  }
  return Device
}
