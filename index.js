const { ApolloServer, gql } = require("apollo-server");
const { prisma } = require("./generated/prisma-client");

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar DateTime

  type Query {
    feed: [Post!]!
    drafts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createDraft(title: String!, content: String!, authorEmail: String!): Post!
    deletePost(id: ID!): Post
    publish(id: ID!): Post
  }

  type Post {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    isPublished: Boolean!
    title: String!
    content: String!
    author: User!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    posts: [Post!]!
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    feed: (parent, args, ctx) => ctx.db.posts({ where: { isPublished: true } }),
    drafts: (parent, args, ctx) =>
      ctx.db.posts({ where: { isPublished: false } }),
    post: (parent, args, ctx) => ctx.db.post({ id: args.id })
  },
  Mutation: {
    createDraft: (parent, args, ctx) => {
      return ctx.db.createPost({
        title: args.title,
        content: args.content,
        author: { connect: { email: args.authorEmail } }
      });
    },

    deletePost: (parent, { id }, ctx) => ctx.db.deletePost({ id }),

    publish: (parent, { id }, ctx) => {
      return ctx.db.updatePost({
        where: { id },
        data: { isPublished: true }
      });
    }
  },
  Post: {
    author: (parent, args, ctx) => ctx.db.post({ id: parent.id }).author()
  },
  User: {
    posts: (parent, args, ctx) => ctx.db.user({ id: parent.id }).posts()
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { db: prisma }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
