const { gql } = require("apollo-server");

const typeDefs = gql`
  #graphql
  type User {
    id: ID!
    email: String!
    token: String!
    # profile: [Profile]
  }
  type Profile {
    id: ID!
    firstName: String!
    lastName: String
    contactNo: String!
    companyName: String!
    address: String!
    city: String!
    state: String!
    postalCode: String!
    favourites: [String]
    cart: [String]
    user: User
    userId: ID
    reviews: [Review]
  }

  type category {
    id: ID!
    name: String!
    products: [Product!]
  }

  type Product {
    id: ID!
    title: String!
    originalPrice: Int!
    discount: Int
    image: String!
    isFavourite: Boolean
    discountedPrice: Float
    isNewProduct: Boolean
    description: String!
    category: [String!]!
    reviews: [Review]
  }

  type Review {
    id: ID!
    rating: Int!
    content: String!
    profile: Profile!
    product: Product!
  }

  type Query {
    users: [User]
    userProfiles: [Profile]
    findProfile(email: String!): Profile
    products(limit: Int, offset: Int): [Product]
    product(id: ID!): Product
    searchProducts(query: String!): [Product]
    reviews: [Review]
    category: [category]
  }

  input userInput {
    email: String!
    password: String!
  }
  input profileInput {
    firstName: String!
    lastName: String
    contactNo: String!
    companyName: String!
    address: String!
    city: String!
    state: String!
    postalCode: String!
    userId: ID!
  }

  input categoryInput {
    name: String!
  }

  input productInput {
    title: String!
    originalPrice: Int!
    discount: Int
    image: String!
    isFavourite: Boolean
    isNewProduct: Boolean
    description: String!
    category: [String!]!
  }

  input reviewInput {
    rating: Int!
    content: String!
    # userId: String!
    profileId: String!
    productId: String!
  }

  input reviewEdit {
    rating: Int
    content: String
  }

  input passwordEdit {
    password: String
  }
  input profileEdit {
    firstName: String
    lastName: String
    contactNo: String
    companyName: String
  }
  input productEdit {
    title: String
    originalPrice: Int
    discount: Int
    image: String
    isFavourite: Boolean
    isNewProduct: Boolean
    description: String
    category: [String!]
  }

  type Mutation {
    addUser(user: userInput!): User
    addUserProfile(profile: profileInput!, email: String!): Profile
    loginUser(email: String!, password: String!): User
    updatePassword(email: String!, edits: passwordEdit, password: String!): User
    updateProfile(email: String!, edits: profileEdit): Profile
    deleteUser(id: ID!): Boolean
    deleteProfile(email: String!): Boolean
    addProduct(product: productInput): Product
    updateProduct(id: ID!, edits: productEdit): Product
    deleteProduct(id: ID!): Boolean
    addToFavourites(email: String!, productId: ID!): Profile
    removeFromFavourites(email: String!, productId: ID!): Profile
    addToCart(email: String!, productId: ID!): Profile
    removeFromCart(email: String!, productId: ID!): Profile
    addReview(reviews: reviewInput!): Review
    updateReview(
      id: ID!
      email: String!
      productId: ID!
      edits: reviewEdit
    ): Review
    deleteReview(id: ID!): Boolean
    addCategory(category: categoryInput): category
    removeCategory(id: ID!): Boolean
  }
  type Subscription {
    newProduct: Product!
  }
`;
module.exports = typeDefs;
