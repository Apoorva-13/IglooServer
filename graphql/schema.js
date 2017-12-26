import { makeExecutableSchema } from 'graphql-tools'
import fs from 'fs'
import resolvers from './resolvers'

const typeDefs = fs.readFileSync('./graphql/types.graphql').toString()

export default makeExecutableSchema({ typeDefs, resolvers })
