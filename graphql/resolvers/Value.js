import { authenticated, logErrorsPromise } from './utilities'

// remove this piece
// VVVVVVVVVVV
const firstResolve = promises =>
  new Promise((resolve, reject) => {
    const errors = []
    let count = 0
    let resolved = false
    promises.forEach((promise, idx) => {
      promise
        .then((found) => {
          if (!resolved) {
            resolved = true
            resolve(found)
          }
        })
        .catch((err) => {
          errors[idx] = err
          count += 1
          if (count === promises.length) {
            reject(errors)
          }
        })
    })
  })
// ^^^^^^^^^^^^^^^^

const retrieveValueScalarProp = (SequelizeValues, prop) => (root, context) =>
  logErrorsPromise(
    'retrieveValueScalarProp',
    130,
    authenticated(context, async (resolve, reject) => {
      const NOT_ALLOWED =
        'You are not allowed to access details about this resource'
      const NOT_EXIST = 'The requested resource does not exist'
      const models = Object.values(SequelizeValues)

      // race all the models to find the looked for id, if a value is found
      // it is returned otherwise the correct error is returned
      firstResolve(models.map(Model =>
        new Promise(async (resolveInner, rejectInner) => {
          const resourceFound = await Model.find({
            where: { id: root.id },
          })

          /* istanbul ignore next */
          if (!resourceFound) {
            rejectInner(NOT_EXIST)
          } else if (resourceFound.userId !== context.auth.userId) {
            /* istanbul ignore next */
            rejectInner(NOT_ALLOWED)
          } else {
            resolveInner(resourceFound[prop])
          }
        })))
        .then(propFound => resolve(propFound))
        .catch((e) => {
          // choose the correct error, because normally most models
          // will reject with NOT_EXIST, simply because the value
          // looked for is of another type

          reject(e.reduce((acc, val) =>
            (acc === NOT_ALLOWED || val === NOT_ALLOWED
              ? NOT_ALLOWED
              : NOT_EXIST)))
        })
    }),
  )

const ValueResolver = SequelizeValues => ({
  createdAt: retrieveValueScalarProp(SequelizeValues, 'createdAt'),
  updatedAt: retrieveValueScalarProp(SequelizeValues, 'updatedAt'),
  permission: retrieveValueScalarProp(SequelizeValues, 'permission'),
  relevance: retrieveValueScalarProp(SequelizeValues, 'relevance'),
  valueDetails: retrieveValueScalarProp(SequelizeValues, 'valueDetails'),
  tileSize: retrieveValueScalarProp(SequelizeValues, 'tileSize'),
  customName: retrieveValueScalarProp(SequelizeValues, 'customName'),
  __resolveType: (root, context) =>
    logErrorsPromise(
      'value resolve type',
      131,
      authenticated(context, async (resolve, reject) => {
        const NOT_ALLOWED =
          'You are not allowed to access details about this resource'
        const NOT_EXIST = 'The requested resource does not exist'
        const models = Object.values(SequelizeValues)

        function indexToType(idx) {
          const modelName = Object.keys(SequelizeValues)[idx]

          return modelName === 'BoolValue' ? 'BooleanValue' : modelName
        }

        // race all the models to find the looked for id, if a value is found
        // it is returned otherwise the correct error is returned
        const modelFetches = models.map((Model, idx) =>
          new Promise(async (resolveInner, rejectInner) => {
            const resourceFound = await Model.find({
              where: { id: root.id },
            })
            /* istanbul ignore next */
            if (!resourceFound) {
              rejectInner(NOT_EXIST)
            } else if (resourceFound.userId !== context.auth.userId) {
              /* istanbul ignore next */
              rejectInner(NOT_ALLOWED)
            } else {
              resolveInner(indexToType(idx))
            }
          }))

        firstResolve(modelFetches)
          .then(typeFound => resolve(typeFound))
          .catch((e) => {
            // choose the correct error, because normally most models
            // will reject with NOT_EXIST, simply because the value
            // looked for is of another type

            reject(e.reduce((acc, val) =>
              (acc === NOT_ALLOWED || val === NOT_ALLOWED
                ? NOT_ALLOWED
                : NOT_EXIST)))
          })
      }),
    ),
})

export default ValueResolver
