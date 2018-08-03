import { MockBillingUpdater } from './mocks'

// checks that the resolver returns all the scalar props
// as they are in the database
function checkScalarProps(propList, correctData, Resolver, Mock) {
  // loops all the props and for each prop creates a
  // resolver with a mocked database, tries to resolve
  // the prop and checks that the result is correct
  for (const prop of propList) {
    it(`should resolve the prop ${prop}`, async () => {
      const mock = Mock()
      const resolver = Resolver(mock)

      const mockBillingUpdater = MockBillingUpdater()
      const propLoaded = await resolver[prop](
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

      expect(mock.find.called).toBe(true)
      expect(propLoaded).toBe(correctData[prop])
    })
  }
}

module.exports = {
  checkScalarProps,
}
