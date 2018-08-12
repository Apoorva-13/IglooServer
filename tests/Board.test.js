import BoardResolver from '../graphql/resolvers/Board'
import { MockDevice, MockBoard, MockBillingUpdater } from './mocks'
import {
  checkScalarProps,
  checkDevicesProp,
  checkRejectUnauthenticated,
} from './utilities'

describe('Board resolver', () => {
  const boardScalarProps = ['customName', 'avatar']
  checkScalarProps(
    boardScalarProps,
    MockBoard.mockData,
    BoardResolver,
    MockBoard,
    'fakeBoardId',
  )

  test('should resolve prop user', async () => {
    const mockBoard = MockBoard()
    const resolver = BoardResolver(mockBoard)

    const mockBillingUpdater = MockBillingUpdater()
    const userLoaded = await resolver.user(
      { id: 'fakeBoardId' },
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

    expect(mockBoard.find.called).toBe(true)
    expect(userLoaded.id).toBe(MockBoard.mockData.userId)
  })

  checkDevicesProp((mockDevice) => {
    const mockBoard = MockBoard()
    return BoardResolver(mockBoard, mockDevice)
  }, 'fakeBoardId')

  const boardProps = [...boardScalarProps, 'user', 'devices']

  checkRejectUnauthenticated(boardProps, BoardResolver, MockBoard)
})
