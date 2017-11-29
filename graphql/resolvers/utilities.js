const authenticated = (context, callback) =>
    context.auth
        ? callback
        : (resolve, reject) =>
              reject(
                  "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
              )

module.exports = {
    authenticated,
}
