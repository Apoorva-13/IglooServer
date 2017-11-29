const authenticated = (context, callback) =>
    context.auth
        ? callback
        : (resolve, reject) =>
              reject(
                  "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
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
                        log(
                            chalk.red("INTERNAL ERROR - retrieveScalarProp 109")
                        )
                        log(e)
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
    retrieveScalarProp,
}
