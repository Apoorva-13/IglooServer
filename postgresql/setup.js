const Sequelize = require('sequelize')
const chalk = require('chalk')

const log = console.log
require('dotenv').config()

/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  ssl: true,
  dialect: 'postgres',
  dialectOptions: {
    ssl: true,
  },
  logging: false,
})

const {
  User,
  Device,
  BoolValue,
  FloatValue,
  StringValue,
  PlotValue,
  PlotNode,
  MapValue,
  ColourValue,
  Notification,
  PermanentToken,
} = require('./databaseDefinition')(sequelize)

const setup = async () => {
  try {
    await User.sync({ force: true })
    await Device.sync({ force: true })
    await BoolValue.sync({ force: true })
    await FloatValue.sync({ force: true })
    await StringValue.sync({ force: true })
    await PlotValue.sync({ force: true })
    await PlotNode.sync({ force: true })
    await MapValue.sync({ force: true })
    await ColourValue.sync({ force: true })
    await Notification.sync({ force: true })
    await PermanentToken.sync({ force: true })

    log(chalk.green('ALL WELL'))
    sequelize.close()
  } catch (e) {
    log(chalk.red(e))
  }
}

setup()
