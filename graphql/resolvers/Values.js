import {
  authenticated,
  retrieveScalarProp,
  logErrorsPromise,
} from './utilities'

const GenericResolver = Model => ({
  createdAt: retrieveScalarProp(Model, 'createdAt'),
  updatedAt: retrieveScalarProp(Model, 'updatedAt'),
  permission: retrieveScalarProp(Model, 'permission'),
  relevance: retrieveScalarProp(Model, 'relevance'),
  valueDetails: retrieveScalarProp(Model, 'valueDetails'),
  tileSize: retrieveScalarProp(Model, 'tileSize'),
  customName: retrieveScalarProp(Model, 'customName'),
  value: retrieveScalarProp(Model, 'value'),
})

const BooleanValueResolver = GenericResolver
const FloatValueResolver = Model => ({
  ...GenericResolver(Model),
  precision: retrieveScalarProp(Model, 'precision'),
  boundaries: retrieveScalarProp(Model, 'boundaries'),
})
const StringValueResolver = Model => ({
  ...GenericResolver(Model),
  maxChars: retrieveScalarProp(Model, 'maxChars'),
  allowedValues: retrieveScalarProp(Model, 'allowedValues'),
})
const ColourValueResolver = Model => ({
  ...GenericResolver(Model),
  allowedValues: retrieveScalarProp(Model, 'allowedValues'),
})
const PlotValueResolver = (PlotValue, PlotNode) => ({
  ...GenericResolver(PlotValue),
  precision: retrieveScalarProp(PlotValue, 'precision'),
  boundaries: retrieveScalarProp(PlotValue, 'boundaries'),
  threshold: retrieveScalarProp(PlotValue, 'threshold'),
  // overriding GenericResolver's value
  value: (root, args, context) =>
    logErrorsPromise(
      'PlotValueResolver',
      135,
      authenticated(context, async (resolve, reject) => {
        const nodes = await PlotNode.findAll({ where: { plotId: root.id } })
        resolve(nodes)
      }),
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
        }
      }),
    )
  },
})

export default ({
  BoolValue,
  FloatValue,
  StringValue,
  ColourValue,
  PlotValue,
  PlotNode,
}) => ({
  BooleanValue: BooleanValueResolver(BoolValue),
  FloatValue: FloatValueResolver(FloatValue),
  StringValue: StringValueResolver(StringValue),
  ColourValue: ColourValueResolver(ColourValue),
  PlotValue: PlotValueResolver(PlotValue, PlotNode),
  PlotNode: PlotNodeResolver(PlotNode),
})
