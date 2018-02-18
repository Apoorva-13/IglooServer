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
})

const ColourValueResolver = GenericResolver

export default ({
  BoolValue, FloatValue, StringValue, ColourValue,
}) => ({
  BooleanValue: BooleanValueResolver(BoolValue),
  FloatValue: FloatValueResolver(FloatValue),
  StringValue: StringValueResolver(StringValue),
  ColourValue: ColourValueResolver(ColourValue),
})
