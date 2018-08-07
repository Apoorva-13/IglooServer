require('dotenv').config()
/* istanbul ignore if */
if (!process.env.JWT_SECRET) {
  throw new Error('Could not load .env')
}
import express from 'express'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import bodyParser from 'body-parser'
import schema from './graphql/schema'
import expressJwt from 'express-jwt'
import cors from 'cors'
import webpush from 'web-push'
import { pipeStreamToS3, getObjectOwner } from './s3helpers'
import Busboy from 'connect-busboy'
import AWS from 'aws-sdk'
import path from 'path'
import UpdateBatcher from 'update-batcher'
import {
  PermanentToken,
  WebPushSubscription,
  User,
} from './postgresql/databaseConnection'
import jwt from 'jwt-simple'

webpush.setVapidDetails(
  'http://igloo.witlab.io/',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY,
)

const GRAPHQL_PORT = process.env.PORT || 3000
/* istanbul ignore next */
const WEBSOCKET_URL =
  process.env.NODE_ENV === 'production'
    ? 'wss://iglooql.herokuapp.com/subscriptions'
    : `ws://localhost:${GRAPHQL_PORT}/subscriptions`
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(expressJwt({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
  isRevoked: async (req, payload, done) => {
    if (payload.tokenType === 'TEMPORARY') done(null, false)
    else if (payload.tokenType === 'PERMANENT') {
      try {
        const DatabaseToken = await PermanentToken.find({
          where: { id: payload.tokenId },
        })
        return done(
          null,
          !(DatabaseToken && DatabaseToken.userId === payload.userId),
        )
      } catch (e) {
        done('Internal error')
      }
    } else {
      // TODO: if we use different jwt secrets this will become unnecessary
      // if the token is not an authentication token reject it
      done(null, true)
    }
  },
}))

const updateUserBilling = auth => async (bill) => {
  const userFound = await User.find({ where: { id: auth.userId } })

  // TODO: handle this failure gracefully
  if (!userFound) {
    throw new Error("User doesn't exist. Use `SignupUser` to create one")
  } else {
    const newUser = await userFound.increment('monthUsage', { by: bill })
    return newUser.monthUsage
  }
}

// TODO: replace with real free usage quota
const FREE_USAGE_QUOTA = 100 * 1000

// Check if usage threshold was exceeded
app.use('/graphql', async (req, res, next) => {
  // TODO: implement anti-DDOS here
  if (!req.user) next()
  else {
    const userFound = await User.find({ where: { id: req.user.userId } })

    if (!userFound) {
      res.send("This user doesn't exist anymore")
      return
    } else if (
      userFound.paymentPlan === 'FREE' &&
      userFound.monthUsage > FREE_USAGE_QUOTA
    ) {
      req.user.tokenType = 'SWITCH_TO_PAYING'
    } else if (
      userFound.paymentPlan === 'PAYING' &&
      userFound.usageCap &&
      userFound.monthUsage > userFound.usageCap
    ) {
      req.user.tokenType = 'CHANGE_USAGE_CAP'
    }

    next()
  }
})

app.use(
  '/graphql',
  graphqlExpress(req => ({
    schema,
    context: {
      auth: req.user,
      billingUpdater: req.user
        ? new UpdateBatcher(updateUserBilling(req.user))
        : undefined,
    },
  })),
)
/* istanbul ignore next */
app.get('/graphiql', (req, res, next) => {
  if (req.query.bearer) {
    return graphiqlExpress({
      endpointURL: '/graphql',
      subscriptionsEndpoint: WEBSOCKET_URL,
      passHeader: `'Authorization': 'Bearer ${req.query.bearer}'`,
      websocketConnectionParams: {
        Authorization: `Bearer ${req.query.bearer}`,
      },
    })(req, res, next)
  }
  return graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: WEBSOCKET_URL,
  })(req, res, next)
})

app.post('/webPushSubscribe', async (req, res) => {
  if (req.user) {
    const notificationSubscription = req.body

    const oldSubscription = await WebPushSubscription.find({
      where: { endpoint: notificationSubscription.endpoint },
    })

    const newSubscription = {
      endpoint: notificationSubscription.endpoint,
      expirationTime: notificationSubscription.expirationTime,
      p256dh: notificationSubscription.keys.p256dh,
      auth: notificationSubscription.keys.auth,
      userId: req.user.userId,
    }

    if (!oldSubscription) {
      await WebPushSubscription.create(newSubscription)
    } else {
      oldSubscription.update(newSubscription)
    }

    res.send('ok')
  } else {
    res.status(401).send('Missing valid authentication token')
  }
})

AWS.config.update({ region: 'eu-west-1' })
const s3 = new AWS.S3()

app.post('/fileupload', Busboy(), async (req, res) => {
  if (req.user) {
    req.pipe(req.busboy)

    req.busboy.on('error', (err) => {
      console.log(err)
    })

    req.busboy.on('file', async (fieldname, file, filename) => {
      const extension = path.extname(filename)
      const newObject = await pipeStreamToS3(
        s3,
        process.env.BUCKET_NAME,
        file,
        extension,
        req.user.userId,
      )
      res.send(newObject.key)
    })
  } else {
    res.status(401).send('Missing valid authentication token')
  }
})

app.get('/file/:file', async (req, res) => {
  if (req.user) {
    const getParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: req.params.file,
    }

    const objectOwner = await getObjectOwner(s3, getParams)

    if (objectOwner === req.user.userId) {
      s3
        .getObject(getParams)
        .createReadStream()
        .pipe(res)
    } else {
      res.status(401).send('You are not authorized to read this file')
    }
  } else {
    res.status(401).send('Missing valid authentication token')
  }
})

app.get('/fileuploadtest', (req, res) => {
  res.send(`<html><head></head><body>
  <script>
   function send(){
    var formData = new FormData();
    var fileField = document.querySelector("input[type='file']");

    formData.append('file', fileField.files[0]);
    
    fetch('http://localhost:3000/fileupload', {
      method: 'POST',
      body: formData,
      "headers": {
        "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJleHAiOjE1MjU0NDQxODAsInVzZXJJZCI6ImFjZjJlODY2LWY4NTktNDAwMi05ZDdhLWRlY2JkMzE2NTFhZCIsImFjY2Vzc0xldmVsIjoiT1dORVIiLCJ0b2tlblR5cGUiOiJURU1QT1JBUlkifQ.gdcPD0i6XHe-5_bLWIcQzAQNecJ4st-dZ-1wiYwNXrkYTNa1pjw--ub4v3WRNXzN97ylQSH869Rfd3KnNZ3X5A"
      }
    })
    .catch(error => console.error('Error:', error))
    .then(response=>response.text().then(console.log))
   }
   
   </script>
     <input type="file" name="file"><br />
     <button onclick="send()">SEND</button>
   
 </body></html>`)
})

app.get('/verifyEmail/:verificationToken', async (req, res) => {
  const { verificationToken } = req.params
  try {
    const decodedToken = jwt.decode(
      verificationToken,
      process.env.JWT_SECRET,
      false,
      'HS512',
    )

    if (decodedToken.tokenType !== 'EMAIL_VERIFICATION') {
      res.send('Malformed token')
    } else {
      const foundUser = await User.find({ userId: decodedToken.userId })

      if (!foundUser) {
        res.send("User doesn't exist anymore")
      } else if (decodedToken.email !== foundUser.email) {
        res.send("This isn't your primary email anymore")
      } else {
        foundUser.update({ emailIsVerified: true })

        res.redirect('https://igloocloud.github.io/IglooAurora')
      }
    }
  } catch (e) {
    res.send('Failed verification')
  }
})

export default app
