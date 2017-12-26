"use strict"

const Sequelize = require("sequelize")

const databaseDefinition = sequelize => {
    const ValuePermission = Sequelize.ENUM("READ_ONLY", "READ_WRITE")
    const ValueRelevance = Sequelize.ENUM(
        "MAIN",
        "NORMAL",
        "ADVANCED",
        "HIDDEN"
    )
    const selfId = {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
    }
    const otherId = (fieldName, model) => ({
        [fieldName]: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: model,
                key: "id",
                deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
            },
        },
    })

    const User = sequelize.define("user", {
        ...selfId,
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        twoFactorSecret: {
            type: Sequelize.STRING,
        },
    })

    const Device = sequelize.define("device", {
        ...selfId,
        ...otherId("userId", User),
        deviceType: {
            type: Sequelize.STRING,
        },
        customName: {
            type: Sequelize.STRING,
        },
        tags: {
            type: Sequelize.ARRAY(Sequelize.STRING),
        },
    })

    const Value = sequelize.define("value", {
        ...selfId,
        ...otherId("userId", User),
        ...otherId("deviceId", Device),
        valueDetails: {
            type: Sequelize.STRING,
        },
        permission: {
            type: ValuePermission,
        },
        relevance: {
            type: ValueRelevance,
        },
    })

    const BoolValue = sequelize.define("boolValue", {
        ...selfId,
        ...otherId("userId", User),
        value: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
        },
    })
    const FloatValue = sequelize.define("floatValue", {
        ...selfId,
        ...otherId("userId", User),
        value: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        precision: {
            type: Sequelize.FLOAT,
        },
        boundaries: {
            type: Sequelize.ARRAY(Sequelize.FLOAT),
        },
    })
    const StringValue = sequelize.define("stringValue", {
        ...selfId,
        ...otherId("userId", User),
        value: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        maxChars: {
            type: Sequelize.INTEGER,
        },
    })
    const PlotValue = sequelize.define("plotValue", {
        ...selfId,
        ...otherId("userId", User),
    })
    const PlotNode = sequelize.define("plotNode", {
        ...selfId,
        ...otherId("userId", User),
        ...otherId("plotValueId", PlotValue),
        value: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        key: {
            type: Sequelize.DATE,
            allowNull: false,
        },
    })
    const MapValue = sequelize.define("mapValue", {
        ...selfId,
        ...otherId("userId", User),
        latitude: {
            type: Sequelize.FLOAT,
        },
        longitude: {
            type: Sequelize.FLOAT,
        },
        map: {
            type: Sequelize.JSON,
            allowNull: false,
        },
    })
    const ColourValue = sequelize.define("colourValue", {
        ...selfId,
        ...otherId("userId", User),
        value: {
            type: Sequelize.STRING,
        },
    })

    Value.belongsTo(BoolValue, {
        as: "childBool",
    })
    Value.belongsTo(FloatValue, {
        as: "childFloat",
    })
    Value.belongsTo(StringValue, {
        as: "childString",
    })
    Value.belongsTo(PlotValue, {
        as: "childPlot",
    })
    Value.belongsTo(MapValue, {
        as: "childMap",
    })
    Value.belongsTo(ColourValue, {
        as: "childColour",
    })

    return {
        User,
        Device,
        Value,
        BoolValue,
        FloatValue,
        StringValue,
        PlotValue,
        PlotNode,
        MapValue,
        ColourValue,
    }
}

module.exports = databaseDefinition
