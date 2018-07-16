require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys

;

(async () => {
  const product = await stripe.products.create({
    name: 'Igloo Houston',
    type: 'service',
  })

  const plan = await stripe.plans.create({
    product: product.id,
    nickname: 'Igloo Starter Plan',
    currency: 'eur',
    interval: 'month',
    amount: 1,
  })

  console.log(`Plan: ${plan.id}`)
})()
