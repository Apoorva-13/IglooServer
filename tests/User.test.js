import UserResolver from '../graphql/resolvers/User'
import {
  MockUser,
  mockUserData,
  MockDevice,
  mockDeviceData,
  MockBillingUpdater,
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

  it('should resolve paymentPlan even with SWITCH_TO_PAYING authorization', async () => {
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

  it('should resolve usageCap even with CHANGE_USAGE_CAP authorization', async () => {
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
    expect(devices[0]).toBe(mockDeviceData)
  })
})
