import jwt from "jwt-simple"
import moment from "moment"

const JWT_EXPIRE_DAYS = 7

const authenticated = (context, callback) =>
    context.auth
        ? callback
        : (resolve, reject) =>
              reject(
                  "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
              )

const generateAuthenticationToken = (userId, JWT_SECRET) =>
    jwt.encode(
        {
            exp: moment()
                .utc()
                .add({days: JWT_EXPIRE_DAYS})
                .unix(),
            userId,
        },
        JWT_SECRET
    )

const retrieveScalarProp = (Model, prop) => {
    return (root, args, context) => {
        return new Promise(
            authenticated(context, (resolve, reject) => {
                Model.find({where: {id: root.id}})
                    .then(resourceFound => {
                        if (!resourceFound) {
                            reject("The requested resource does not exist")
                        } else if (
                            resourceFound.userId !== context.auth.userId
                        ) {
                            reject(
                                "You are not allowed to access details about this resource"
                            )
                        } else {
                            resolve(resourceFound[prop])
                        }
                    })
                    .catch(e => {
                        /* istanbul ignore next */
                        log(
                            chalk.red("INTERNAL ERROR - retrieveScalarProp 109")
                        )
                        /* istanbul ignore next */
                        log(e)
                        /* istanbul ignore next */
                        reject(
                            "109 - An internal error occured, please contact us. The error code is 109"
                        )
                    })
            })
        )
    }
}
module.exports = {
    authenticated,
    generateAuthenticationToken,
    retrieveScalarProp,
}
