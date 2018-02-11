const Sequelize = require('sequelize')
const DataLoader = require('dataloader')
const _ = require('underscore')

const { Op } = Sequelize

module.exports = (
  {
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
    Notification,
  },
  cache = true,
) => {
  const LoaderFactory = Model => ({
    find: new DataLoader(
      keys =>
        new Promise(async (resolve, reject) => {
          const queryResponse = await Model.findAll({
            where: { id: { [Op.in]: keys } },
          })
          const items = queryResponse.map(res => res.dataValues)

          // prefill the array with null values, so that not found items will return null
          const itemsOrderedByKey = _.range(keys.length).map(() => null)

          // take every item found an put it in the right place in the array
          for (let i = 0; i < items.length; i++) {
            const index = keys.indexOf(items[i].id)
            if (index !== -1) {
              itemsOrderedByKey[index] = items[i]
            }
          }
          resolve(itemsOrderedByKey)
        }),
      { cache },
    ),
    findAllByUserId: new DataLoader(
      keys =>
        new Promise(async (resolve, reject) => {
          const queryResponse = await Model.findAll({
            where: { userId: { [Op.in]: keys } },
          })
          const items = queryResponse.map(res => res.dataValues)

          // prefill the array with void arrays
          const itemsOrderedByKey = _.range(keys.length).map(() => [])

          // take every item found an put it in the right place in the array
          for (let i = 0; i < items.length; i++) {
            const index = keys.indexOf(items[i].userId)
            if (index !== -1) {
              itemsOrderedByKey[index].push(items[i])
            }
          }
          resolve(itemsOrderedByKey)
        }),
      { cache },
    ),
    findAllByDeviceId: new DataLoader(
      keys =>
        new Promise(async (resolve, reject) => {
          const queryResponse = await Model.findAll({
            where: { deviceId: { [Op.in]: keys } },
          })
          const items = queryResponse.map(res => res.dataValues)

          // prefill the array with void arrays
          const itemsOrderedByKey = _.range(keys.length).map(() => [])

          // take every item found an put it in the right place in the array
          for (let i = 0; i < items.length; i++) {
            const index = keys.indexOf(items[i].deviceId)
            if (index !== -1) {
              itemsOrderedByKey[index].push(items[i])
            }
          }
          resolve(itemsOrderedByKey)
        }),
      { cache },
    ),
  })

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
  const notificationLoader = LoaderFactory(Notification)

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
    notificationLoader,
  }
}
