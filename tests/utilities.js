import {
  MockBillingUpdater,
  MockBoolValue,
  mockBoolValueData,
  MockColourValue,
  mockColourValueData,
  MockFloatValue,
  mockFloatValueData,
  MockMapValue,
  mockMapValueData,
  MockPlotValue,
  mockPlotValueData,
  MockStringValue,
  mockStringValueData,
} from './mocks'

// checks that the resolver returns all the scalar props
// as they are in the database
function checkScalarProps(propList, correctData, Resolver, Mock) {
  // loops all the props and for each prop creates a
  // resolver with a mocked database, tries to resolve
  // the prop and checks that the result is correct
  for (const prop of propList) {
    test(`should resolve the prop ${prop}`, async () => {
      const mock = Mock()
      const resolver = Resolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      const propLoaded = await resolver[prop](
        { id: 'fakeUserId' },
        {},
        {
          auth: {
            userId: 'fakeUserId',
            accessLevel: 'OWNER',
            tokenType: 'TEMPORARY',
          },
          billingUpdater: mockBillingUpdater,
        },
      )

      expect(mock.find.called).toBe(true)
      expect(propLoaded).toBe(correctData[prop])
    })
  }
}

// resolver should take the mock values only as input
function checkValuesProp(resolverGenerator) {
  test('should resolve the prop values', async () => {
    const mockBoolValue = MockBoolValue()
    const mockFloatValue = MockFloatValue()
    const mockStringValue = MockStringValue()
    const mockColourValue = MockColourValue()
    const mockPlotValue = MockPlotValue()
    const mockMapValue = MockMapValue()

    const mockValues = [
      mockFloatValue,
      mockStringValue,
      mockBoolValue,
      mockColourValue,
      mockPlotValue,
      mockMapValue,
    ]
    const resolver = resolverGenerator(mockValues)

    const mockBillingUpdater = MockBillingUpdater()
    const values = await resolver.values(
      { id: 'fakeUserId' },
      {},
      {
        auth: {
          userId: 'fakeUserId',
          accessLevel: 'OWNER',
          tokenType: 'TEMPORARY',
        },
        billingUpdater: mockBillingUpdater,
      },
    )

    mockValues.forEach(mockValue => expect(mockValue.findAll.called).toBe(true))
    expect(values.length).toBe(6)
    values.forEach((value) => {
      expect(value.__resolveType).toBeDefined()

      // expect every value to be a slice of the value returned by the mock function
      switch (value.__resolveType) {
        case 'BooleanValue':
          expect(value).toEqual(expect.objectContaining(mockBoolValueData))
          break
        case 'FloatValue':
          expect(value).toEqual(expect.objectContaining(mockFloatValueData))
          break
        case 'StringValue':
          expect(value).toEqual(expect.objectContaining(mockStringValueData))
          break
        case 'ColourValue':
          expect(value).toEqual(expect.objectContaining(mockColourValueData))
          break
        case 'PlotValue':
          expect(value).toEqual(expect.objectContaining(mockPlotValueData))
          break
        case 'MapValue':
          expect(value).toEqual(expect.objectContaining(mockMapValueData))
          break
        default:
          throw new Error(`received unexpected __resolveType: ${value.__resolveType}`)
          break
      }
    })
  })
}

module.exports = {
  checkScalarProps,
  checkValuesProp,
}
