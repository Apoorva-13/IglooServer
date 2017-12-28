import { subscriptionFilterOnlyMine } from './utilities'

const subscriptionResolver = pubsub => ({
  deviceCreated: subscriptionFilterOnlyMine('deviceCreated', pubsub),
  valueCreated: subscriptionFilterOnlyMine('valueCreated', pubsub),
  userUpdated: subscriptionFilterOnlyMine('userUpdated', pubsub),
  deviceUpdated: subscriptionFilterOnlyMine('deviceUpdated', pubsub),
})
export default subscriptionResolver
