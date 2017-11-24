import {makeExecutableSchema, addMockFunctionsToSchema} from "graphql-tools"
import fs from "fs"
import resolvers from "./resolvers"

const typeDefs = fs.readFileSync("./data/types.graphql").toString()

export default makeExecutableSchema({typeDefs, resolvers})
