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

  for (const prop of userScalarProps) {
    it(`should not resolve ${prop} if not authenticated`, async () => {
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

  it('should resolve the prop paymentPlan even with SWITCH_TO_PAYING authorization', async () => {
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

  it('should resolve the prop usageCap even with CHANGE_USAGE_CAP authorization', async () => {
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

  it('should resolve the prop devices', async () => {
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
    expect(mockDeviceData).toEqual(expect.objectContaining(devices[0]))
  })

  it('should resolve the prop notifications', async () => {
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
    expect(mockPermanentTokenData).toEqual(expect.objectContaining(permanentTokens[0]))
  })

  it('should resolve the prop permanentTokens', async () => {
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
    expect(mockNotificationData).toEqual(expect.objectContaining(notifications[0]))
  })
})
