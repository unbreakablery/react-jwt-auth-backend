const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql');

const UserType = require("./user.js");
const DocType = require("./doc.js");

const userDB = require("../models/users.js");
const docDB = require("../models/docs.js");

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query',
  fields: () => ({
    user: {
      type: UserType,
      description: 'A single user',
      args: {
        email: { type: GraphQLString }
      },
      resolve: async function(parent, args) {
        const db = await userDB.getDb();
        const result = await db.collection.find({}).toArray();
          
        return result.find(user => user.email === args.email);
      }
    },
    doc: {
      type: DocType,
      description: 'A single doc',
      args: {
        name: { type: GraphQLString },
        author: { type: GraphQLString }
      },
      resolve: async function(parent, args) {
        const db = await docDB.getDb();
        const result = await db.collection.find({}).toArray();

        return result.filter(doc => doc.name === args.name && doc.author === args.author);
      }
    },
    users: {
      type: new GraphQLList(UserType),
      description: 'List of users',
      resolve: async function() {
        const db = await userDB.getDb();
        const result = await db.collection.find({}).toArray();

        return result;
      }
    },
    docs: {
      type: new GraphQLList(DocType),
      description: 'List of docs',
      args: {
        _id: { type: GraphQLString },
        type: { type: GraphQLString },
        name: { type: GraphQLString },
        html: { type: GraphQLString },
        author: { type: GraphQLString }
      },
      resolve: async function(parent, args, ctx) {
        // console.log(ctx.headers['x-access-token']);
        const db = await docDB.getDb();
        const result = await db.collection.find({}).toArray();

        if (args.name && args.author) {
          return result.filter(doc => doc.name.includes(args.name) && doc.author === args.author);
        }

        if (args.name) {          
          return result.filter(doc => doc.name.includes(args.name));
        }

        if (args.author) {
          return result.filter(doc => doc.author === args.author);
        }

        return result;
      }
    },
  })
});

module.exports = RootQueryType;
