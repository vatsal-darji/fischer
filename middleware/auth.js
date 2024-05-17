// const { AuthenticationError, ApolloError } = require("apollo-server");
// require("dotenv").config();
const jwt = require("jsonwebtoken");

class Auth {
  static decodeJWTTokens = (token) => {
    return jwt.verify(token, process.env.JWT_SEC);
  };
}
module.exports = Auth;
