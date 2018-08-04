import sinon from 'sinon'

function MockResolver(data) {
  const findStub = sinon.stub()
  findStub.returns(data)

  const findAllStub = sinon.stub()
  findAllStub.returns([data])

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

module.exports = {
  mockUserData,
  MockUser: MockResolver(mockUserData),
  mockDeviceData,
  MockDevice: MockResolver(mockDeviceData),
  mockNotificationData,
  MockNotification: MockResolver(mockNotificationData),
  mockPermanentTokenData,
  MockPermanentToken: MockResolver(mockPermanentTokenData),
  MockBillingUpdater,
}
