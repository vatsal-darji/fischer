const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const mongoose = require("mongoose");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { MongoError } = require("mongodb");
const connectDB = require("./config/db");
const cors = require("cors");
// const { applyMiddleware } = require("apollo-server-express");
const userAuth = require("./middleware/auth");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
// const context = require("./graphql/context");

async function startServer() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  const server = new ApolloServer({
    schema,
    formatError: (error) => {
      if (error.originalError instanceof MongoError) {
        return {
          message: error.message,
          code: "DATABASE_ERROR",
          httpStatusCode: 500,
        };
      }
      if (error.originalError && error.originalError.extensions) {
        const { code, httpStatusCode } = error.originalError.extensions;
        return {
          message: error.message,
          code: code || "INTERNAL_SERVER_ERROR",
          httpStatusCode: httpStatusCode || 500,
        };
      }
      return error;
    },
    introspection: true,
    context: async ({ req }) => {
      const token = req.headers["token"] || "";

      try {
        const user = userAuth.decodeJWTTokens(token);
        return { user };
      } catch (error) {
        return { user: null };
      }
    },
    // context: ({ req, res, pubsub }) => ({ req, res, pubsub }),
  });

  await server.start();

  const app = express();
  const PORT = process.env.PORT || 9000;
  app.use(
    "/graphql",
    cors(),

    express.json()
  );
  server.applyMiddleware({ app, path: "/" });

  const httpServer = createServer(app);

  //websocket server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  connectDB();

  httpServer.listen(PORT, () => {
    console.log(
      `Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`
    );
  });
}
startServer();
