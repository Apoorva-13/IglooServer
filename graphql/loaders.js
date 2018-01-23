const Sequelize = require('sequelize')
const DataLoader = require('dataloader')
const _ = require('underscore')

const { Op } = Sequelize

module.exports = (
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
) => {
  const LoaderFactory = Model =>
    new DataLoader(keys =>
      new Promise(async (resolve, reject) => {
        const queryResponse = await Model.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const devices = queryResponse.map(res => res.dataValues)

        // prefill the array with null values, so that not found items will return null
        const devicesOrderedByKey = _.range(keys.length).map(() => null)

        // take every item found an put it in the right place in the array
        for (let i = 0; i < devices.length; i++) {
          const index = keys.indexOf(devices[i].id)
          if (index !== -1) {
            devicesOrderedByKey[index] = devices[i]
          }
        }
        resolve(devicesOrderedByKey)
      }))

  const deviceLoader = LoaderFactory(Device)
  const userLoader = LoaderFactory(User)
  const valueLoader = LoaderFactory(Value)
  const boolValueLoader = LoaderFactory(BoolValue)
  const floatValueLoader = LoaderFactory(FloatValue)
  const stringValueLoader = LoaderFactory(StringValue)
  const plotValueLoader = LoaderFactory(PlotValue)
  const plotNodeLoader = LoaderFactory(PlotNode)
  const mapValueLoader = LoaderFactory(MapValue)
  const colourValueLoader = LoaderFactory(ColourValue)

  return {
    deviceLoader,
    userLoader,
    valueLoader,
    boolValueLoader,
    floatValueLoader,
    stringValueLoader,
    plotValueLoader,
    plotNodeLoader,
    mapValueLoader,
    colourValueLoader,
  }
}
