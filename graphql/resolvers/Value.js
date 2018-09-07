import {
  authenticated,
  authorizationLevel,
  logErrorsPromise,
  authorizedValue,
  firstResolve,
  instanceToRole,
} from './utilities'

const QUERY_COST = 1

const retrieveValueScalarProp = (Values, prop, Device, Board) => (
  root,
  context,
) =>
  authorizedValue(
    root.id,
    context,
    Values,
    User,
    1,
    (resolve, reject, valueFound) => resolve(valueFound[prop]),
    Device,
    Board,
  )

const valueScalarPropsResolvers = (Model, User, props, Device, Board) =>
  props.reduce((acc, prop) => {
    acc[prop] = retrieveValueScalarProp(Model, prop, Device, Board)
    return acc
  }, {})

const ValueResolver = (Values, User, Device, Board) => ({
  ...valueScalarPropsResolvers(
    Values,
    User,
    [
      'createdAt',
      'updatedAt',
      'permission',
      'relevance',
      'valueDetails',
      'tileSize',
      'customName',
      'index',
    ],
    Device,
    Board,
  ),
  myRole(root, args, context) {
    return authorizedValue(
      root.id,
      context,
      Values,
      User,
      1,
      (resolve, reject, valueFound, valueAndParents, userFound) => {
        const myRole = instanceToRole(valueAndParents, userFound)
        resolve(myRole)
      },
      Device,
      Board,
    )
  },
  __resolveType: (root, context) =>
    logErrorsPromise(
      'value resolve type',
      131,
      authenticated(context, async (resolve, reject) => {
        const NOT_ALLOWED =
          'You are not allowed to access details about this resource'
        const NOT_EXIST = 'The requested resource does not exist'
        const models = Object.values(Values)

        // TODO: resolve this stuff
        function indexToType(idx) {
          const modelName = Object.keys(Values)[idx]

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
            } else {
              const userFound = await User.find({
                where: { id: context.auth.userId },
              })
              const deviceFound = await Device.find({
                where: { id: resourceFound.deviceId },
              })
              const boardFound = deviceFound.boardId
                ? await Board.find({
                  where: { id: deviceFound.boardId },
                })
                : null

              if (
                authorizationLevel(
                  boardFound
                    ? [resourceFound, deviceFound, boardFound]
                    : [resourceFound, deviceFound],
                  userFound,
                ) < 1
              ) {
                /* istanbul ignore next */
                rejectInner(NOT_ALLOWED)
              } else {
                resolveInner(indexToType(idx))
              }
            }
          }))

        firstResolve(modelFetches)
          .then(typeFound => resolve(typeFound))
          /* istanbul ignore next */
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
