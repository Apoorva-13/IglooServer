import UserResolver from '../graphql/resolvers/User'
import {
  MockUser,
  mockUserData,
  MockDevice,
  mockDeviceData,
  MockBillingUpdater,
  mockNotificationData,
  MockNotification,
  mockPermanentTokenData,
  MockPermanentToken,
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
import { checkScalarProps } from './utilities'

describe('User resolver', () => {
  const userScalarProps = [
    'createdAt',
    'updatedAt',
    'email',
    'quietMode',
    'language',
    'timezone',
    'devMode',
    'nightMode',
    'signalStatus',
    'batteryStatus',
    'paymentPlan',
    'usageCap',
    'monthUsage',
  ]

  checkScalarProps(userScalarProps, mockUserData, UserResolver, MockUser)

  test('should resolve the prop paymentPlan even with SWITCH_TO_PAYING authorization', async () => {
    const mock = MockUser()
    const resolver = UserResolver(mock)

    const mockBillingUpdater = MockBillingUpdater()
    const paymentPlan = await resolver.paymentPlan(
      { id: 'fakeUserId' },
      {},
      {
        auth: {
          userId: 'fakeUserId',
          accessLevel: 'OWNER',
          tokenType: 'SWITCH_TO_PAYING',
        },
        billingUpdater: mockBillingUpdater,
      },
    )

    expect(mock.find.called).toBe(true)
    expect(paymentPlan).toBe(mockUserData.paymentPlan)
  })

  test('should resolve the prop usageCap even with CHANGE_USAGE_CAP authorization', async () => {
    const mock = MockUser()
    const resolver = UserResolver(mock)

    const mockBillingUpdater = MockBillingUpdater()
    const usageCap = await resolver.usageCap(
      { id: 'fakeUserId' },
      {},
      {
        auth: {
          userId: 'fakeUserId',
          accessLevel: 'OWNER',
          tokenType: 'CHANGE_USAGE_CAP',
        },
        billingUpdater: mockBillingUpdater,
      },
    )

    expect(mock.find.called).toBe(true)
    expect(usageCap).toBe(mockUserData.usageCap)
  })

  test('should resolve the prop devices', async () => {
    const mockDevice = MockDevice()
    const resolver = UserResolver(null, null, mockDevice)

    const mockBillingUpdater = MockBillingUpdater()
    const devices = await resolver.devices(
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

    expect(mockDevice.findAll.called).toBe(true)
    expect(devices.length).toBe(1)

    // devices[0] should be a slice of the object returned by the mock resolver
    delete devices[0].dataValues
    expect(mockDeviceData).toEqual(expect.objectContaining(devices[0]))
  })

  test('should resolve the prop notifications', async () => {
    const mockPermanentToken = MockPermanentToken()
    const resolver = UserResolver(null, mockPermanentToken)

    const mockBillingUpdater = MockBillingUpdater()
    const permanentTokens = await resolver.permanentTokens(
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

    expect(mockPermanentToken.findAll.called).toBe(true)
    expect(permanentTokens.length).toBe(1)

    // permanentTokens[0] should be a slice of the object returned by the mock resolver
    delete permanentTokens[0].dataValues
    expect(mockPermanentTokenData).toEqual(expect.objectContaining(permanentTokens[0]))
  })

  test('should resolve the prop permanentTokens', async () => {
    const mockNotification = MockNotification()
    const resolver = UserResolver(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      mockNotification,
    )

    const mockBillingUpdater = MockBillingUpdater()
    const notifications = await resolver.notifications(
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

    expect(mockNotification.findAll.called).toBe(true)
    expect(notifications.length).toBe(1)

    // notifications[0] should be a slice of the object returned by the mock resolver
    delete notifications[0].dataValues
    expect(mockNotificationData).toEqual(expect.objectContaining(notifications[0]))
  })

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
    const resolver = UserResolver(null, null, null, null, ...mockValues, null)

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

  const userProps = [
    'createdAt',
    'updatedAt',
    'email',
    'quietMode',
    'language',
    'timezone',
    'devMode',
    'nightMode',
    'signalStatus',
    'batteryStatus',
    'paymentPlan',
    'usageCap',
    'monthUsage',
    'devices',
    'notifications',
    'values',
    'permanentTokens',
  ]

  for (const prop of userProps) {
    test(`should not resolve ${prop} if not authenticated`, async () => {
      const mock = MockUser()
      const resolver = UserResolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      try {
        await resolver[prop](
          { id: 'fakeUserId' },
          {},
          {
            billingUpdater: mockBillingUpdater,
          },
        )
      } catch (e) {
        expect(e).toBe('You are not authenticated. Use `AuthenticateUser` to obtain an authentication token')
      }
    })
  }
})
