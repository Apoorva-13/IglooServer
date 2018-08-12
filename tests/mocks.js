import sinon from 'sinon'

function MockResolver(data) {
  const findStub = ({ where: query }) => {
    let querySatisfied = true
    for (const key of Object.keys(query)) {
      if (data[key] !== query[key]) querySatisfied = false
    }

    findStub.called = true

    return querySatisfied ? { ...data, dataValues: data } : null
  }
  findStub.called = false

  const findAllStub = ({ where: query }) => {
    let querySatisfied = true
    for (const key of Object.keys(query)) {
      if (data[key] !== query[key]) querySatisfied = false
    }

    findAllStub.called = true

    return querySatisfied ? [{ ...data, dataValues: data }] : []
  }
  findAllStub.called = false

  const factory = () => ({
    find: findStub,
    findAll: findAllStub,
    mockData: data,
  })

  factory.mockData = data

  return factory
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

const mockBoardData = {
  id: 'fakeBoardId',
  customName: 'Example Board Name',
  avatar: 'Example Avatar',
  userId: 'fakeUserId',
}

const mockDeviceData = {
  id: 'fakeDeviceId',
  createdAt: '', // TODO: real dates
  updatedAt: '',
  userId: 'fakeUserId',
  boardId: 'fakeBoardId',
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

const mockStringPlotValueData = {
  ...mockValueData,
  id: 'fakeStringPlotValueId',
  allowedValues: ['cat', 'dog'],
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
  MockUser: MockResolver(mockUserData),
  MockBoard: MockResolver(mockBoardData),
  MockDevice: MockResolver(mockDeviceData),
  MockNotification: MockResolver(mockNotificationData),
  MockPermanentToken: MockResolver(mockPermanentTokenData),
  MockBoolValue: MockResolver(mockBoolValueData),
  MockFloatValue: MockResolver(mockFloatValueData),
  MockStringValue: MockResolver(mockStringValueData),
  MockPlotValue: MockResolver(mockPlotValueData),
  MockStringPlotValue: MockResolver(mockStringPlotValueData),
  MockMapValue: MockResolver(mockMapValueData),
  MockColourValue: MockResolver(mockColourValueData),
  MockBillingUpdater,
}
