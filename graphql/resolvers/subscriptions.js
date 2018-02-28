import { subscriptionFilterOnlyMine } from './utilities'

const subscriptionResolver = pubsub => ({
  deviceCreated: subscriptionFilterOnlyMine('deviceCreated', pubsub),
  valueCreated: subscriptionFilterOnlyMine('valueCreated', pubsub),
  notificationCreated: subscriptionFilterOnlyMine(
    'notificationCreated',
    pubsub,
  ),
  userUpdated: subscriptionFilterOnlyMine('userUpdated', pubsub),
  deviceUpdated: subscriptionFilterOnlyMine('deviceUpdated', pubsub),
  valueUpdated: subscriptionFilterOnlyMine('valueUpdated', pubsub),
  notificationUpdated: subscriptionFilterOnlyMine(
    'notificationUpdated',
    pubsub,
  ),
  notificationDeleted: subscriptionFilterOnlyMine(
    'notificationDeleted',
    pubsub,
  ),
  valueDeleted: subscriptionFilterOnlyMine('valueDeleted', pubsub),
})
export default subscriptionResolver
