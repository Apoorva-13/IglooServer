import Sequelize from 'sequelize'

require('dotenv').config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}

const { JWT_SECRET } = process.env

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  ssl: true,
  dialect: 'postgres',
  dialectOptions: {
    ssl: true,
  },
  logging: false,
  pool: {
    max: 20,
    min: 1,
    idle: 20000,
    acquire: 40000,
    evict: 20000,
  },
})

module.exports = { ...require('./databaseDefinition')(sequelize), sequelize }
