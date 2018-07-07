require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const product = await stripe.products.create({
      name: 'Igloo Houston',
      type: 'service',
    })

    const plan = await stripe.plans.create({
      product: product.id,
      nickname: 'Pay per Use - 1000 items',
      currency: 'usd',
      interval: 'month',
      amount: 10, // 0.10 $
      usage_type: 'metered',
    })

    console.log(`Plan: ${plan.id}`)
  } catch (e) {
    console.log(e)
  }
})()
