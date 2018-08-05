import DeviceResolver from '../graphql/resolvers/Device'
import { checkScalarProps, checkValuesProp } from './utilities'
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
})
