const Sequelize = require("sequelize")
const chalk = require("chalk")
const log = console.log
require("dotenv").config()

/* instanbul ignore if */
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}
const {HOST, DATABASE, DB_USERNAME, PASSWORD} = process.env

const sequelize = new Sequelize({
    host: HOST,
    port: 5432,
    database: DATABASE,
    username: DB_USERNAME,
    password: PASSWORD,
    ssl: true,
    dialect: "postgres",
    dialectOptions: {
        ssl: true,
    },
})

const {
    User,
    Device,
    Value,
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColorValue,
} = require("./databaseDefinition")(sequelize)

const setup = async () => {
    try {
        await User.sync({force: true})
        await Device.sync({force: true})
        await Value.sync({force: true})
        await BoolValue.sync({force: true})
        await FloatValue.sync({force: true})
        await StringValue.sync({force: true})
        await PlotValue.sync({force: true})
        await PlotNode.sync({force: true})
        await MapValue.sync({force: true})
        await ColorValue.sync({force: true})

        log(chalk.green("ALL WELL"))
        sequelize.close()
    } catch (e) {
        log(chalk.red(e))
    }
}

setup()
