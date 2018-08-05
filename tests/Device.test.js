import DeviceResolver from '../graphql/resolvers/Device'
import {
  checkScalarProps,
  checkValuesProp,
  checkNotificationsProp,
  checkRejectUnauthenticated,
} from './utilities'
import { MockDevice, MockBillingUpdater } from './mocks'

describe('Device resolver', () => {
  const deviceScalarProps = [
    'createdAt',
    'updatedAt',
    'deviceType',
    'customName',
    'icon',
    'index',
    'online',
  ]

  checkScalarProps(
    deviceScalarProps,
    MockDevice.mockData,
    DeviceResolver,
    MockDevice,
  )

  const mockDevice = MockDevice()
  checkValuesProp(([
    mockFloatValue,
    mockStringValue,
    mockBoolValue,
    mockColourValue,
    mockPlotValue,
    mockMapValue,
  ]) =>
    DeviceResolver(
      mockDevice,
      null,
      null,
      mockBoolValue,
      mockFloatValue,
      mockStringValue,
      mockPlotValue,
      null,
      mockMapValue,
      mockColourValue,
    ))

  checkNotificationsProp(mockNotification =>
    DeviceResolver(
      mockDevice,
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
    ))

  test('should resolve prop user', async () => {
    const mockDevice = MockDevice()
    const resolver = DeviceResolver(mockDevice)

    const mockBillingUpdater = MockBillingUpdater()
    const userLoaded = await resolver.user(
      { id: 'fakeDeviceId' },
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

    expect(mockDevice.find.called).toBe(true)
    expect(userLoaded.id).toBe(MockDevice.mockData.userId)
  })

  const deviceProps = [
    'createdAt',
    'updatedAt',
    'deviceType',
    'customName',
    'icon',
    'index',
    'online',
    'values',
    'user',
    'notifications',
  ]
  checkRejectUnauthenticated(deviceProps, DeviceResolver, MockDevice)
})
