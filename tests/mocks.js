import sinon from 'sinon'

function MockResolver(data) {
  const findStub = sinon.stub()
  findStub.resolves({ ...data, dataValues: data })

  const findAllStub = sinon.stub()
  findAllStub.resolves([{ ...data, dataValues: data }])

  return () => ({
    find: findStub,
    findAll: findAllStub,
  })
}

const mockUserData = {
  id: 'fakeUserId',
  createdAt: '', // TODO: real dates
  updatedAt: '',
  email: 'fakeemail@gmail.com',
  quietMode: false,
  language: 'it-IT',
  timezone: 'UTC+00:00',
  devMode: false,
  nightMode: false,
  signalStatus: 0.3,
  batteryStatus: 0.8,
  paymentPlan: 'PAYING',
  usageCap: 500,
  monthUsage: 200,
}

const mockDeviceData = {
  id: 'fakeDeviceId',
  createdAt: '', // TODO: real dates
  updatedAt: '',
  userId: 'fakeUserId',
  deviceType: 'Example Device Type',
  customName: 'Example Custom Name',
  icon: 'example icon',
  index: 0,
  online: false,
}

const mockNotificationData = {
  id: 'fakeNotificationId',
  deviceId: 'fakeDeviceId',
  userId: 'fakeUserId',
  content: 'Example content',
  date: '',
  visualized: false,
  snackbarVisualized: false,
}

const mockPermanentTokenData = {
  id: 'fakePermanentTokenId',
  userId: 'fakeUserId',
  customName: 'Example custom name',
}

function MockBillingUpdater() {
  const updateStub = sinon.stub()

  return {
    update: updateStub,
  }
}

const mockValueData = {
  userId: 'fakeUserId',
  deviceId: 'fakeDeviceId',
  valueDetails: 'example value details',
  permission: 'READ_WRITE',
  relevance: 'VISIBLE',
  tileSize: 'NORMAL',
  customName: 'example custom name',
}

const mockBoolValueData = {
  ...mockValueData,
  value: false,
  id: 'fakeBoolValueId',
}

const mockFloatValueData = {
  ...mockValueData,
  value: 3.4,
  precision: 0.1,
  boundaries: [0, 10],
  id: 'fakeFloatValueId',
}

const mockStringValueData = {
  ...mockValueData,
  value: 'example string data',
  maxChars: 50,
  allowedValues: ['red', 'green', 'blue'],
  id: 'fakeStringValueId',
}

const mockPlotValueData = {
  ...mockValueData,
  precision: 0.01,
  threshold: 0.8,
  boundaries: [0, 1],
  id: 'fakePlotValueId',
}

const mockMapValueData = {
  ...mockValueData,
  id: 'fakeMapValueId',
  latitude: 53.2,
  longitude: 10.2,
  height: 32,
  value: '',
}

const mockColourValueData = {
  ...mockValueData,
  id: 'fakeColourValueId',
  value: '#f0f',
  allowedValues: ['#f00', '#f0f', '#fff'],
}

module.exports = {
  mockUserData,
  MockUser: MockResolver(mockUserData),
  mockDeviceData,
  MockDevice: MockResolver(mockDeviceData),
  mockNotificationData,
  MockNotification: MockResolver(mockNotificationData),
  mockPermanentTokenData,
  MockPermanentToken: MockResolver(mockPermanentTokenData),
  mockBoolValueData,
  MockBoolValue: MockResolver(mockBoolValueData),
  mockFloatValueData,
  MockFloatValue: MockResolver(mockFloatValueData),
  mockStringValueData,
  MockStringValue: MockResolver(mockStringValueData),
  mockPlotValueData,
  MockPlotValue: MockResolver(mockPlotValueData),
  mockMapValueData,
  MockMapValue: MockResolver(mockMapValueData),
  mockColourValueData,
  MockColourValue: MockResolver(mockColourValueData),
  MockBillingUpdater,
}