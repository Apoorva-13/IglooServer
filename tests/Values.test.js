import ValuesResolvers from '../graphql/resolvers/Values'
import {
  MockBillingUpdater,
  MockBoolValue,
  MockColourValue,
  MockFloatValue,
  MockMapValue,
  MockPlotValue,
  MockStringValue,
  MockStringPlotValue,
  MockPlotNode,
  MockStringPlotNode,
} from './mocks'
import { checkScalarProps } from './utilities'

describe('ValuesResolvers', () => {
  const genericPropsList = [
    'createdAt',
    'updatedAt',
    'permission',
    'relevance',
    'valueDetails',
    'tileSize',
    'customName',
  ]

  const booleanPropsList = [...genericPropsList, 'value']
  const floatPropsList = [
    ...genericPropsList,
    'precision',
    'boundaries',
    'value',
  ]
  const stringPropsList = [
    ...genericPropsList,
    'value',
    'maxChars',
    'allowedValues',
  ]
  const colourPropsList = [...genericPropsList, 'value', 'allowedValues']
  const plotPropsList = [
    ...genericPropsList,
    'precision',
    'boundaries',
    'threshold',
  ]
  const stringPlotPropsList = [...genericPropsList, 'allowedValues']

  const BooleanValueResolver = BoolValue =>
    ValuesResolvers({ BoolValue }).BooleanValue
  const FloatValueResolver = FloatValue =>
    ValuesResolvers({ FloatValue }).FloatValue
  const StringValueResolver = StringValue =>
    ValuesResolvers({ StringValue }).StringValue
  const ColourValueResolver = ColourValue =>
    ValuesResolvers({ ColourValue }).ColourValue
  const PlotValueResolver = PlotValue =>
    ValuesResolvers({ PlotValue }).PlotValue
  const StringPlotValueResolver = StringPlotValue =>
    ValuesResolvers({ StringPlotValue }).StringPlotValue

  checkScalarProps(
    booleanPropsList,
    MockBoolValue.mockData,
    BooleanValueResolver,
    MockBoolValue,
    'fakeBoolValueId',
  )
  checkScalarProps(
    floatPropsList,
    MockFloatValue.mockData,
    FloatValueResolver,
    MockFloatValue,
    'fakeFloatValueId',
  )
  checkScalarProps(
    stringPropsList,
    MockStringValue.mockData,
    StringValueResolver,
    MockStringValue,
    'fakeStringValueId',
  )
  checkScalarProps(
    colourPropsList,
    MockColourValue.mockData,
    ColourValueResolver,
    MockColourValue,
    'fakeColourValueId',
  )
  checkScalarProps(
    plotPropsList,
    MockPlotValue.mockData,
    PlotValueResolver,
    MockPlotValue,
    'fakePlotValueId',
  )
  checkScalarProps(
    stringPlotPropsList,
    MockStringPlotValue.mockData,
    StringPlotValueResolver,
    MockStringPlotValue,
    'fakeStringPlotValueId',
  )

  test('PlotValue resolver should resolve value', async () => {
    const mockPlotValue = MockPlotValue()
    const mockPlotNode = MockPlotNode()

    const resolver = ValuesResolvers({
      PlotValue: mockPlotValue,
      PlotNode: mockPlotNode,
    }).PlotValue

    const value = await resolver.value(
      {
        id: 'fakePlotValueId',
      },
      {},
      {
        auth: {
          userId: 'fakeUserId',
          accessLevel: 'OWNER',
          tokenType: 'TEMPORARY',
        },
        billingUpdater: MockBillingUpdater(),
      },
    )

    expect(mockPlotNode.findAll.called).toBe(true)
    expect(value.length).toBe(1)
    expect(value[0].id).toBe(MockPlotNode.mockData.id)
  })

  test('StringPlotValue resolver should resolve value', async () => {
    const mockStringPlotValue = MockStringPlotValue()
    const mockStringPlotNode = MockStringPlotNode()

    const resolver = ValuesResolvers({
      StringPlotValue: mockStringPlotValue,
      StringPlotNode: mockStringPlotNode,
    }).StringPlotValue

    const value = await resolver.value(
      {
        id: 'fakeStringPlotValueId',
      },
      {},
      {
        auth: {
          userId: 'fakeUserId',
          accessLevel: 'OWNER',
          tokenType: 'TEMPORARY',
        },
        billingUpdater: MockBillingUpdater(),
      },
    )

    expect(mockStringPlotNode.findAll.called).toBe(true)
    expect(value.length).toBe(1)
    expect(value[0].id).toBe(MockStringPlotNode.mockData.id)
  })
})
