import GraphQLToolsTypes from "graphql-tools-types"
import Sequelize from "sequelize"
import chalk from "chalk"
import bcrypt from 'bcryptjs'
import jwt from 'jwt-simple'
import moment from 'moment'
const log = console.log

const config = require('dotenv').config()
if (!config.parsed){
    throw new Error ("Could not load .env")
}
const {HOST, DATABASE, USERNAME, PASSWORD, JWT_SECRET} = config.parsed    


const sequelize = new Sequelize({
    host:HOST,
    port:5432,
    database:DATABASE,
    username:USERNAME,
    password:PASSWORD,
        ssl: true,
        dialect:"postgres",
        dialectOptions: {
            ssl: true
        }
    }
)

const {
    User,
    Device,
    Value,
    BoolValue,
    FloatValue,
    StringValue,
    PlotValue,
    PlotNode,
    MapValue,
    ColorValue,
} = require("../postgresql/databaseDefinition")(sequelize)

const resolvers = {
    DateTime: GraphQLToolsTypes.Date({name: "DateTime"}),
    UUID: GraphQLToolsTypes.UUID({name: "UUID"}),
    Json: GraphQLToolsTypes.JSON({name: "Json"}),
    Mutation: {
        AuthenticateUser(root, args){
            return new Promise((resolve,reject)=>{
                User.find({where:{email:args.email}}).then(userFound=>{
                    if(!userFound){
                        reject("User doesn't exist. Use `SignupUser` to create one")
                    }else if (bcrypt.compareSync(args.password, userFound.dataValues.password)){
                        resolve({
                            id: userFound.dataValues.id,
                            token: jwt.encode({
                                exp:moment().utc().add({ days: 7 }).unix(),
                                userId: userFound.dataValues.id,
                            },
                            JWT_SECRET)
                        })
                    }else{
                        reject("Wrong password")
                    }
                })
            })
        },
        SignupUser(root, args){
            return new Promise((resolve,reject)=>{
                // checks if a user with that email already exists
                // if not it creates one and returnes a valid token
                User.find({where:{email:args.email}}).then(user=>{
                    if (user){
                        reject("A user with this email already exists")
                    }else{
                        const encryptedPass = bcrypt.hashSync(args.password, 10);

                        User.create({email:args.email, password:encryptedPass}).then((newUser)=>{
                            resolve({
                                id: newUser.dataValues.id,
                                token: jwt.encode({
                                    exp:moment().utc().add({ days: 7 }).unix(),
                                    userId: newUser.dataValues.id,
                                },
                                JWT_SECRET)
                            })
                        }).catch(e=>{
                            reject(e.message)
                        })
                    }
                })
                
            })
        },
        ChangePassword(root, args){
            return new Promise((resolve,reject)=>{
                User.find({where:{email:args.email}}).then(userFound=>{
                    if(!userFound){
                        reject("User doesn't exist. Use `SignupUser` to create one")
                    }else if (bcrypt.compareSync(args.oldPassword, userFound.dataValues.password)){
                        const encryptedPass = bcrypt.hashSync(args.newPassword, 10);

                        userFound.update({
                            password:encryptedPass
                        }).then((newUser)=>{
                            resolve({
                                id: newUser.dataValues.id,
                                token: jwt.encode({
                                    exp:moment().utc().add({ days: 7 }).unix(),
                                    userId: newUser.dataValues.id,
                                },
                                JWT_SECRET)
                            }).catch(e=>{
                                log(chalk.red("INTERNAL ERROR - ChangePassword 100"))
                                log(e)
                                reject("An internal error occured, please contact us. The error code is 100")
                            })
                        })
                    }else{
                        reject("Wrong password")
                    }
                }).catch(e=>{
                    log(chalk.red("INTERNAL ERROR - ChangePassword 101"))
                    log(e)
                    reject("An internal error occured, please contact us. The error code is 101")
                })
            })
        }
    },
}

export default resolvers
