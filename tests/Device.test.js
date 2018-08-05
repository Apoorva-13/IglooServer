import DeviceResolver from '../graphql/resolvers/Device'
import { checkScalarProps } from './utilities'
import { mockDeviceData, MockDevice } from './mocks'

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
    mockDeviceData,
    DeviceResolver,
    MockDevice,
  )
})
