import ValueResolver from '../graphql/resolvers/Value'
import { checkRejectUnauthenticated } from './utilities'
import {
  MockBillingUpdater,
  MockBoolValue,
  MockColourValue,
  MockFloatValue,
  MockMapValue,
  MockPlotValue,
  MockStringValue,
} from './mocks'

describe('Value resolvers', () => {
  const valueScalarProps = [
    'createdAt',
    'updatedAt',
    'permission',
    'relevance',
    'valueDetails',
    'tileSize',
    'customName',
  ]

  for (const prop of valueScalarProps) {
    test(`should resolve the prop ${prop}`, async () => {
      // check that user resolves the prop no matter
      // which Value type it is on
      const mockValues = [
        MockBoolValue,
        MockFloatValue,
        MockStringValue,
        MockColourValue,
        MockPlotValue,
        MockMapValue,
      ]

      for (const MockValue of mockValues) {
        const mockBoolValue = MockBoolValue()
        const mockFloatValue = MockFloatValue()
        const mockStringValue = MockStringValue()
        const mockColourValue = MockColourValue()
        const mockPlotValue = MockPlotValue()
        const mockMapValue = MockMapValue()

        const resolver = ValueResolver({
          BoolValue: mockBoolValue,
          FloatValue: mockFloatValue,
          StringValue: mockStringValue,
          PlotValue: mockPlotValue,
          MapValue: mockMapValue,
          ColourValue: mockColourValue,
        })

        const mockBillingUpdater = MockBillingUpdater()
        const propLoaded = await resolver[prop](
          { id: MockValue.mockData.id },
          {
            auth: {
              userId: 'fakeUserId',
              accessLevel: 'OWNER',
              tokenType: 'TEMPORARY',
            },
            billingUpdater: mockBillingUpdater,
          },
        )

        const mocks = [
          mockBoolValue,
          mockFloatValue,
          mockStringValue,
          mockColourValue,
          mockPlotValue,
          mockMapValue,
        ]
        mocks.forEach(mock => expect(mock.find.called).toBe(true))
        expect(propLoaded).toBe(MockValue.mockData[prop])
      }
    })
  }

  test('should choose the correct __resolveType', async () => {
    const idToTypeMap = {
      fakeBoolValueId: 'BooleanValue',
      fakeFloatValueId: 'FloatValue',
      fakeStringValueId: 'StringValue',
      fakePlotValueId: 'PlotValue',
      fakeColourValueId: 'ColourValue',
      fakeMapValueId: 'MapValue',
    }

    for (const id of Object.keys(idToTypeMap)) {
      const mockBoolValue = MockBoolValue()
      const mockFloatValue = MockFloatValue()
      const mockStringValue = MockStringValue()
      const mockColourValue = MockColourValue()
      const mockPlotValue = MockPlotValue()
      const mockMapValue = MockMapValue()

      const resolver = ValueResolver({
        BoolValue: mockBoolValue,
        FloatValue: mockFloatValue,
        StringValue: mockStringValue,
        PlotValue: mockPlotValue,
        MapValue: mockMapValue,
        ColourValue: mockColourValue,
      })

      const mockBillingUpdater = MockBillingUpdater()
      const resolveTypeLoaded = await resolver.__resolveType(
        { id },
        {
          auth: {
            userId: 'fakeUserId',
            accessLevel: 'OWNER',
            tokenType: 'TEMPORARY',
          },
          billingUpdater: mockBillingUpdater,
        },
      )

      expect(resolveTypeLoaded).toBe(idToTypeMap[id])
    }
  })
})
