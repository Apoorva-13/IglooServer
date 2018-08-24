import {
  authenticated,
  authorized,
  retrieveScalarProp,
  authorizedScalarPropsResolvers,
  logErrorsPromise,
  valueToParents,
  instanceToRole,
  inheritAuthorizedScalarPropsResolvers,
  inheritAuthorized,
} from './utilities'

const QUERY_COST = 1

const GenericResolver = (Model, Device, Board) => ({
  ...authorizedScalarPropsResolvers(
    Model,
    [
      'createdAt',
      'updatedAt',
      'permission',
      'relevance',
      'valueDetails',
      'tileSize',
      'customName',
      'value',
      'index',
    ],
    valueToParents(Device, Board),
  ),
  myRole(root, args, context) {
    return logErrorsPromise(
      'GenericValueResolver myRole',
      932,
      authorized(
        root.id,
        context,
        Model,
        1,
        async (resolve, reject, valueFound, valueAndParentsFound) => {
          const myRole = instanceToRole(
            valueAndParentsFound,
            context.auth.userId,
          )
          resolve(myRole)
        },
        valueToParents(Device, Board),
      ),
    )
  },
})

const BooleanValueResolver = GenericResolver
const FloatValueResolver = (Model, Device, Board) => ({
  ...GenericResolver(Model, Device, Board),
  ...authorizedScalarPropsResolvers(
    Model,
    ['precision', 'boundaries'],
    valueToParents(Device, Board),
  ),
})
const StringValueResolver = (Model, Device, Board) => ({
  ...GenericResolver(Model, Device, Board),
  ...authorizedScalarPropsResolvers(
    Model,
    ['maxChars', 'allowedValues'],
    valueToParents(Device, Board),
  ),
})
const ColourValueResolver = (Model, Device, Board) => ({
  ...GenericResolver(Model, Device, Board),
  ...authorizedScalarPropsResolvers(
    Model,
    ['allowedValues'],
    valueToParents(Device, Board),
  ),
})
const PlotValueResolver = (PlotValue, PlotNode, Device, Board) => ({
  ...GenericResolver(PlotValue, Device, Board),
  ...authorizedScalarPropsResolvers(
    PlotValue,
    ['precision', 'boundaries', 'threshold'],
    valueToParents(Device, Board),
  ),
  // overriding GenericResolver's value
  value: (root, args, context) =>
    logErrorsPromise(
      'PlotValueResolver',
      135,
      authorized(
        root.id,
        context,
        PlotValue,
        1,
        async (resolve, reject, plotFound) => {
          const nodes = await PlotNode.findAll({ where: { plotId: root.id } })
          resolve(nodes)
          context.billingUpdater.update(QUERY_COST * nodes.length)
        },
        valueToParents(Device, Board),
      ),
    ),
})
const StringPlotValueResolver = (
  StringPlotValue,
  StringPlotNode,
  Device,
  Board,
) => ({
  ...GenericResolver(StringPlotValue, Device, Board),
  ...authorizedScalarPropsResolvers(
    StringPlotValue,
    ['allowedValues'],
    valueToParents(Device, Board),
  ),
  // overriding GenericResolver's value
  value: (root, args, context) =>
    logErrorsPromise(
      'StringPlotValueResolver',
      135,
      authorized(
        root.id,
        context,
        StringPlotValue,
        1,
        async (resolve, reject, plotFound) => {
          const nodes = await StringPlotNode.findAll({
            where: { plotId: root.id },
          })
          resolve(nodes)
          context.billingUpdater.update(QUERY_COST * nodes.length)
        },
        valueToParents(Device, Board),
      ),
    ),
})

const PlotNodeResolver = (PlotNode, PlotValue, Device, Board) => ({
  ...inheritAuthorizedScalarPropsResolvers(
    PlotNode,
    ['timestamp', 'value'],
    plotNodeFound => plotNodeFound.plotId,
    PlotValue,
    valueToParents(Device, Board),
  ),
  user(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver user resolver',
      136,
      inheritAuthorized(
        root.id,
        PlotNode,
        plotNodeFound => plotNodeFound.plotId,
        context,
        PlotValue,
        1,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotValueAndParents,
        ) => {
          resolve({ id: plotNodeFound.userId })
          context.billingUpdater.update(QUERY_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver device resolver',
      137,
      inheritAuthorized(
        root.id,
        PlotNode,
        plotNodeFound => plotNodeFound.plotId,
        context,
        PlotValue,
        1,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotValueAndParents,
        ) => {
          resolve({ id: plotNodeFound.deviceId })
          context.billingUpdater.update(QUERY_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
  plot(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver plot resolver',
      138,
      inheritAuthorized(
        root.id,
        PlotNode,
        plotNodeFound => plotNodeFound.plotId,
        context,
        PlotValue,
        1,
        async (
          resolve,
          reject,
          plotNodeFound,
          plotValueFound,
          plotValueAndParents,
        ) => {
          resolve(plotValueFound.dataValues)
          context.billingUpdater.update(QUERY_COST)
        },
        valueToParents(Device, Board),
      ),
    )
  },
})

export default (
  {
    BoolValue,
    FloatValue,
    StringValue,
    ColourValue,
    PlotValue,
    PlotNode,
    StringPlotValue,
    StringPlotNode,
  },
  Device,
  Board,
) => ({
  BooleanValue: BooleanValueResolver(BoolValue, Device, Board),
  FloatValue: FloatValueResolver(FloatValue, Device, Board),
  StringValue: StringValueResolver(StringValue, Device, Board),
  ColourValue: ColourValueResolver(ColourValue, Device, Board),
  PlotValue: PlotValueResolver(PlotValue, PlotNode, Device, Board),
  PlotNode: PlotNodeResolver(PlotNode, PlotValue, Device, Board),
  StringPlotValue: StringPlotValueResolver(
    StringPlotValue,
    StringPlotNode,
    Device,
    Board,
  ),
  StringPlotNode: PlotNodeResolver(
    StringPlotNode,
    StringPlotValue,
    Device,
    Board,
  ),
})
