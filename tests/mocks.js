import sinon from 'sinon'

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

function MockUser() {
  const findStub = sinon.stub()
  findStub.returns(mockUserData)

  return {
    find: findStub,
  }
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

function MockDevice() {
  const findStub = sinon.stub()
  findStub.returns(mockDeviceData)

  const findAllStub = sinon.stub()
  findAllStub.returns([mockDeviceData])

  return {
    find: findStub,
    findAll: findAllStub,
  }
}

function MockBillingUpdater() {
  const updateStub = sinon.stub()

  return {
    update: updateStub,
  }
}

module.exports = {
  MockUser,
  mockUserData,
  mockDeviceData,
  MockDevice,
  MockBillingUpdater,
}
