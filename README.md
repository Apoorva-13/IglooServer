![Igloo Houston](https://github.com/hellowitlab/iglooHouston/blob/master/iglooHouston.png?raw=true "Igloo Houston")
# Igloo Houston
Igloo Houston is the back-end service of Igloo Cloud Framework.

This service is still in development, some features may be missing. If your Igloo-based project needs a missing feature in order to work, please open an issue or help us by contributing.

## Getting started
### Installing
Start by cloning the repository and downloading the required libraries:

```bash
git clone https://github.com/hellowitlab/iglooHouston
yarn
```
or

```bash
git clone https://github.com/hellowitlab/iglooHouston
npm install
```

### Set Up
#### Environment variables
You will need to create a file `.env` or inject the variables in the environment yourself, the `.env` file should bee like this:

```
JWT_SECRET=
PUBLIC_VAPID_KEY=
PRIVATE_VAPID_KEY=
DATABASE_URL=
BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

The JWT secret can be whatever password you like, we suggest you [generate a random one](https://www.lastpass.com/password-generator). You can generate the VAPID key pair with [this web app](https://web-push-codelab.glitch.me/). The database URL is a PostgreSQL connection URL with this schema `postgresql://user:password@domain:port/dbname`. The Bucket name is the name of your S3 bucket.

##### Obtaining S3 credentials
- Create credentials: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html
	- create the new account, with access type *programmatic access*
	- attach to the account the policy AmazonS3FullAccess
- Save credentials locally: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
- copy the credentials in the `.env` file

#### Database
To create the database structure needed just run the `setupDatabase` script:
```bash
yarn setupDatabase
```

or

```bash
npm run setupDatabase
```

### Boot up
To start the development server:

```bash
yarn dev
```

or

```bash
npm run dev
```

To start the production server (the code gets transpiled and then run, instead of using the Babel interpreter):

```bash
yarn start
```

or 

```bash
npm start
```

## Documentation
TBD

## Contributing
We are open to any contribution, just send us a pull request. 

### Testing
You can run the automated tests using the `test` script, be aware that the tests do load data on both the S3 bucket and the database and that the database is automatically cleaned before the tests, so you should run tests on a dedicated database (you should always run tests on a dedicated database, but in this case you *really* should).

```bash
yarn test
```

or 

```bash
npm run test
```

## Questions
If you need something that Igloo does not support at the moment, please open an issue and we will discuss whether it fits the project.

## Acknowledgments
TBD


## License
See the [LICENSE](https://github.com/hellowitlab/iglooHouston/blob/master/LICENSE) file for license rights and limitations (MIT).
