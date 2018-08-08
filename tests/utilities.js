import {
  MockBillingUpdater,
  MockBoolValue,
  MockColourValue,
  MockFloatValue,
  MockMapValue,
  MockPlotValue,
  MockStringValue,
  MockStringPlotValue,
  MockNotification,
} from './mocks'

// checks that the resolver returns all the scalar props
// as they are in the database
function checkScalarProps(propList, correctData, Resolver, Mock, id) {
  // loops all the props and for each prop creates a
  // resolver with a mocked database, tries to resolve
  // the prop and checks that the result is correct
  for (const prop of propList) {
    test(`should resolve the prop ${prop}`, async () => {
      const mock = Mock()
      const resolver = Resolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      const propLoaded = await resolver[prop](
        { id },
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
function checkValuesProp(resolverGenerator, id) {
  test('should resolve the prop values', async () => {
    const mockBoolValue = MockBoolValue()
    const mockFloatValue = MockFloatValue()
    const mockStringValue = MockStringValue()
    const mockColourValue = MockColourValue()
    const mockPlotValue = MockPlotValue()
    const mockStringPlotValue = MockStringPlotValue()
    const mockMapValue = MockMapValue()

    const mockValues = [
      mockFloatValue,
      mockStringValue,
      mockBoolValue,
      mockColourValue,
      mockPlotValue,
      mockStringPlotValue,
      mockMapValue,
    ]
    const resolver = resolverGenerator(mockValues)

    const mockBillingUpdater = MockBillingUpdater()
    const values = await resolver.values(
      { id },
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
    expect(values.length).toBe(7)
    values.forEach((value) => {
      expect(value.__resolveType).toBeDefined()

      // expect every value to be a slice of the value returned by the mock function
      switch (value.__resolveType) {
        case 'BooleanValue':
          expect(value).toEqual(expect.objectContaining(MockBoolValue.mockData))
          break
        case 'FloatValue':
          expect(value).toEqual(expect.objectContaining(MockFloatValue.mockData))
          break
        case 'StringValue':
          expect(value).toEqual(expect.objectContaining(MockStringValue.mockData))
          break
        case 'ColourValue':
          expect(value).toEqual(expect.objectContaining(MockColourValue.mockData))
          break
        case 'PlotValue':
          expect(value).toEqual(expect.objectContaining(MockPlotValue.mockData))
          break
        case 'StringPlotValue':
          expect(value).toEqual(expect.objectContaining(MockStringPlotValue.mockData))
          break
        case 'MapValue':
          expect(value).toEqual(expect.objectContaining(MockMapValue.mockData))
          break
        default:
          throw new Error(`received unexpected __resolveType: ${value.__resolveType}`)
          break
      }
    })
  })
}

function checkNotificationsProp(resolverGenerator, id) {
  test('should resolve the prop notifications', async () => {
    const mockNotification = MockNotification()
    const resolver = resolverGenerator(mockNotification)

    const mockBillingUpdater = MockBillingUpdater()
    const notifications = await resolver.notifications(
      { id },
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

    expect(mockNotification.findAll.called).toBe(true)
    expect(notifications.length).toBe(1)

    // notifications[0] should be a slice of the object returned by the mock resolver
    delete notifications[0].dataValues
    expect(MockNotification.mockData).toEqual(expect.objectContaining(notifications[0]))
  })
}

function checkRejectUnauthenticated(propList, Resolver, Mock) {
  for (const prop of propList) {
    test(`should not resolve ${prop} if not authenticated`, async () => {
      const mock = Mock()
      const resolver = Resolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      try {
        await resolver[prop](
          {}, // the request should not be processed so no need to pass a root
          {},
          {
            billingUpdater: mockBillingUpdater,
          },
        )
      } catch (e) {
        expect(e).toBe('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      }
    })

    // TODO: uniform the error message
    test.skip(`should not resolve ${prop} if they don't own the resource`, async () => {
      const mock = Mock()
      const resolver = Resolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      try {
        await resolver[prop](
          {}, // the request should not be processed so no need to pass a root
          {},
          {
            auth: {
              userId: 'fakeOtherUserId',
              accessLevel: 'OWNER',
              tokenType: 'TEMPORARY',
            },
            billingUpdater: mockBillingUpdater,
          },
        )
      } catch (e) {
        // TODO: fill in the error message here
        expect(e).toBe('ERROR_MESSAGE')
      }
    })
  }
}

module.exports = {
  checkScalarProps,
  checkValuesProp,
  checkNotificationsProp,
  checkRejectUnauthenticated,
}
