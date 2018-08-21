import {
  authenticated,
  authorized,
  retrieveScalarProp,
  authorizedScalarPropsResolvers,
  logErrorsPromise,
  valueToParents,
  instanceToRole,
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
const PlotNodeResolver = PlotNode => ({
  timestamp: retrieveScalarProp(PlotNode, 'timestamp'),
  value: retrieveScalarProp(PlotNode, 'value'),
  user(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver user resolver',
      136,
      authenticated(context, async (resolve, reject) => {
        const plotNode = await PlotNode.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!plotNode) {
          reject('The requested resource does not exist')
        } else if (plotNode.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the user id
          resolve({ id: plotNode.userId })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  device(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver device resolver',
      137,
      authenticated(context, async (resolve, reject) => {
        const plotNode = await PlotNode.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!plotNode) {
          reject('The requested resource does not exist')
        } else if (plotNode.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the user id
          resolve({ id: plotNode.deviceId })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
    )
  },
  plot(root, args, context) {
    return logErrorsPromise(
      'PlotNodeResolver plot resolver',
      138,
      authenticated(context, async (resolve, reject) => {
        const plotNode = await PlotNode.find({
          where: { id: root.id },
        })
        /* istanbul ignore if */
        if (!plotNode) {
          reject('The requested resource does not exist')
        } else if (plotNode.userId !== context.auth.userId) {
          /* istanbul ignore next */
          reject('You are not allowed to access details about this resource')
        } else {
          // the User resolver will take care of loading the other props,
          // it only needs to know the user id
          resolve({ id: plotNode.plotId })
          context.billingUpdater.update(QUERY_COST)
        }
      }),
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
  PlotNode: PlotNodeResolver(PlotNode),
  StringPlotValue: StringPlotValueResolver(
    StringPlotValue,
    StringPlotNode,
    Device,
    Board,
  ),
  StringPlotNode: PlotNodeResolver(StringPlotNode),
})
