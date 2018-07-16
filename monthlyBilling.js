import { User, sequelize } from './postgresql/databaseConnection'

require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
  const users = await User.findAll()

  const userUpdates = users.map(async (user) => {
    if (user.paymentPlan === 'PAYING') {
      const usageBilled = Math.ceil(user.monthUsage / 1000)

      // const subscription = await stripe.subscriptions.create({
      //   customer: user.stripeCustomerId,
      //   items: [
      //     {
      //       plan: 'plan_DF1zUqyZOiYzlN',
      //       quantity: usageBilled,
      //     },
      //   ],
      // })

      // await stripe.charges.create({
      //   amount: usageBilled, // in cents
      //   currency: 'eur',
      //   customer: user.stripeCustomerId,
      // })
    }
  })

  await Promise.all(userUpdates)

  sequelize.close()
})()
