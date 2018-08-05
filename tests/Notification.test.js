import NotificationResolver from '../graphql/resolvers/Notification'
import { checkScalarProps, checkRejectUnauthenticated } from './utilities'
import {
  mockNotificationData,
  MockNotification,
  MockBillingUpdater,
} from './mocks'

describe('Notification resolver', () => {
  const notificationScalarProps = [
    'content',
    'date',
    'visualized',
    'snackbarVisualized',
  ]
  checkScalarProps(
    notificationScalarProps,
    mockNotificationData,
    NotificationResolver,
    MockNotification,
  )

  test('should resolve the prop user', async () => {
    const mockNotification = MockNotification()
    const resolver = NotificationResolver(mockNotification)

    const mockBillingUpdater = MockBillingUpdater()
    const userLoaded = await resolver.user(
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

    expect(mockNotification.find.called).toBe(true)
    expect(userLoaded.id).toBe(mockNotificationData.userId)
  })

  test('should resolve the prop device', async () => {
    const mockNotification = MockNotification()
    const resolver = NotificationResolver(mockNotification)

    const mockBillingUpdater = MockBillingUpdater()
    const deviceLoaded = await resolver.device(
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

    expect(mockNotification.find.called).toBe(true)
    expect(deviceLoaded.id).toBe(mockNotificationData.deviceId)
  })

  const notificationProps = [
    'content',
    'date',
    'visualized',
    'snackbarVisualized',
    'user',
    'device',
  ]
  checkRejectUnauthenticated(
    notificationProps,
    NotificationResolver,
    MockNotification,
  )
})
