import UserResolver from '../graphql/resolvers/User'
import {
  MockUser,
  MockDevice,
  MockBillingUpdater,
  MockPermanentToken,
} from './mocks'
import {
  checkScalarProps,
  checkValuesProp,
  checkNotificationsProp,
  checkRejectUnauthenticated,
} from './utilities'

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

  checkScalarProps(
    userScalarProps,
    MockUser.mockData,
    UserResolver,
    MockUser,
    'fakeUserId',
  )

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
    expect(paymentPlan).toBe(MockUser.mockData.paymentPlan)
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
    expect(usageCap).toBe(MockUser.mockData.usageCap)
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
    expect(MockDevice.mockData).toEqual(expect.objectContaining(devices[0]))
  })

  test('should resolve the prop permanentTokens', async () => {
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
    expect(MockPermanentToken.mockData).toEqual(expect.objectContaining(permanentTokens[0]))
  })

  checkNotificationsProp(
    mockNotification =>
      UserResolver(
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
      ),
    'fakeUserId',
  )

  checkValuesProp(
    mockValues => UserResolver(null, null, null, null, ...mockValues, null),
    'fakeUserId',
  )

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

  checkRejectUnauthenticated(userProps, UserResolver, MockUser)
})
