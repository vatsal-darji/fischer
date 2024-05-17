const User = require("../models/user.js");
const Profile = require("../models/profile.js");
const Product = require("../models/product.js");
const Category = require("../models/category.js");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { ApolloError } = require("apollo-server-express");
const { Review } = require("../models/review.js");
// const pubsub = require("./context.js");
// const context = require("./context.js");
const checkAuth = require("../middleware/auth.js");
require("dotenv").config();

const resolvers = {
  Query: {
    async users() {
      try {
        const users = await User.find();
        return users.map((user) => ({
          id: user._id,
          ...user.toObject(),
          profile: user.profile,
        }));
      } catch (error) {
        throw new ApolloError("Failed to fetch users", "FETCH_USERS_ERROR", {
          httpStatusCode: 500,
        });
      }
    },

    //--------------------------------------------------------------------------------

    async userProfiles() {
      const profiles = await Profile.find()
        .populate("user")
        .populate("reviews");
      return profiles.map((profile) => ({
        id: profile._id,
        ...profile.toObject(),
      }));
    },

    //--------------------------------------------------------------------------------

    async findProfile(_, { email }) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id }).populate(
          "user"
        );
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        return {
          id: profile._id,
          ...profile.toObject(),
        };
      } catch (error) {
        console.log("error", error);
        throw new ApolloError(
          "Failed to fetch profile",
          "FETCH_PROFILE_ERROR",
          {
            httpStatusCode: 500,
          }
        );
      }
    },
    //--------------------------------------------------------------------------------

    async products(_, { limit = 100, offset = 0 }, context) {
      try {
        if (!context.user) {
          const products = await Product.find();
          return products.map((products) => ({
            id: products._id,
            ...products._doc,
          }));
        }
        const user = await User.findOne({ email: context.user.email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const products = await Product.find()
          .populate("reviews")
          .skip(offset)
          .limit(limit);
        const productsWithFavourites = products.map((product) => {
          const isFavourite = profile.favourites.includes(
            product._id.toString()
          );
          return { ...product.toObject(), isFavourite };
        });
        return productsWithFavourites;
      } catch (error) {
        throw new ApolloError(
          "Failed to fetch products",
          "FETCH_PRODUCTS_ERROR",
          { httpStatusCode: 500 }
        );
      }
    },

    //--------------------------------------------------------------------------------

    async product(_, { id }, context) {
      try {
        if (!context.user) {
          const product = await Product.findById(id);
          if (!product) {
            throw new ApolloError(
              `Product with ID ${id} not found`,
              "NOT_FOUND",
              {
                httpStatusCode: 404,
              }
            );
          }
          return { ...product.toObject(), id };
        }
        const user = await User.findOne({ email: context.user.email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const product = await Product.findById(id);
        if (!product) {
          throw new ApolloError(
            `Product with ID ${id} not found`,
            "NOT_FOUND",
            {
              httpStatusCode: 404,
            }
          );
        }
        const isFavourite = profile.favourites.includes(product._id.toString());
        const productWithFavourite = { ...product.toObject(), isFavourite };
        return productWithFavourite;
      } catch (error) {
        throw error;
      }
    },

    //--------------------------------------------------------------------------------

    async searchProducts(_, { query }, context) {
      try {
        if (!context.user) {
          const products = await Product.find({
            $or: [
              { title: new RegExp(query, "i") }, // 'i' makes it case insensitive
              { description: new RegExp(query, "i") },
              { category: new RegExp(query, "i") },
            ],
          });
          return products.map((products) => ({
            ...products._doc, // Use _doc instead of toObject()
            id: products._id, // Ensure the id field is included
          }));
        }
        const user = await User.findOne({ email: context.user.email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const products = await Product.find({
          $or: [
            { title: new RegExp(query, "i") }, // 'i' makes it case insensitive
            { description: new RegExp(query, "i") },
            { category: new RegExp(query, "i") },
          ],
        });
        const productsWithFavourites = products.map((product) => {
          const isFavourite = profile.favourites.includes(product._id);
          return {
            ...product._doc, // Use _doc instead of toObject()
            id: product._id, // Ensure the id field is included
            isFavourite,
          };
          // return { ...product.toObject(), isFavourite };
        });
        return productsWithFavourites;
      } catch (error) {
        throw error;
      }
    },

    //--------------------------------------------------------------------------------

    async category() {
      try {
        const category = await Category.find().populate("products");
        if (!category) {
          throw new ApolloError("Category not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        return category.map((category) => ({
          id: category._id,
          ...category.toObject(),
        }));
      } catch (error) {
        throw new ApolloError("can't fetch category", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
    },
  },
  //--------------------------------------------------------------------------------

  Profile: {
    reviews: async (parent) => {
      // Find the user with the given email
      const profile = await Profile.findById(parent.id);
      if (!profile) {
        throw new ApolloError("Profile not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }

      // Find the reviews made by the profile associated with the user
      return profile.reviews;
    },
  },

  Product: {
    reviews: async (parent) => {
      return await Review.find({ productId: parent.id });
    },
  },

  Review: {
    profile: async (parent) => {
      // Find the user associated with the review
      const profile = await Profile.findById(parent.profile);
      if (!profile) {
        throw new ApolloError("Profile not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }

      // Find the profile associated with the user
      return profile;
    },
    product: async (parent) => {
      return await Product.findById(parent.productId);
    },
  },

  //--------------------------------------------------------------------------------
  //Mutation resolvers

  Mutation: {
    async addUser(_, { user }) {
      if (user.password.length < 8) {
        throw new ApolloError(
          "Password must be 8 characters long",
          "BAD_REQUEST",
          { httpStatusCode: 400 }
        );
      }

      if (!validator.isEmail(user.email)) {
        throw new ApolloError("Invalid e-mail address", "BAD_REQUEST", {
          httpStatusCode: 400,
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await User.create({
          ...user,
          password: hashedPassword,
        });
        return { id: newUser._id, ...newUser.toObject() };
      } catch (error) {
        throw new ApolloError(
          "User with that email already exists",
          "DUPLICATE_USER",
          { httpStatusCode: 409 }
        );
      }
    },

    //--------------------------------------------------------------------------------

    async addUserProfile(_, { profile, email }) {
      try {
        const user = await User.findOne({ email });
        const findProfile = await Profile.findOne({
          user: user._id,
        });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        if (findProfile) {
          throw new ApolloError("Profile already exists", "DUPLICATE_PROFILE", {
            httpStatusCode: 409,
          });
        }
        const newProfile = await Profile.create({
          ...profile,
          user: user._id,
        });
        user.profile = newProfile._id;
        await user.save();
        return { id: newProfile._id, ...newProfile.toObject() };
      } catch (error) {
        throw error;
      }
    },

    //-------------------------------------------------------

    async loginUser(_, { email, password }) {
      const currentUser = await User.findOne({ email });
      if (!currentUser) {
        throw new ApolloError("User does not exist", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      const isValidPassword = await bcrypt.compare(
        password,
        currentUser.password
      );
      if (!isValidPassword) {
        throw new ApolloError("Invalid Password", "UNAUTHORIZED", {
          httpStatusCode: 401,
        });
      }
      const token = jwt.sign(
        { user_id: currentUser._id, email },
        process.env.JWT_SEC
        // { expiresIn: "2h" }
      );
      currentUser.token = token;
      await currentUser.save();
      return { ...currentUser.toObject(), id: currentUser._id };
    },

    //-------------------------------------------------------------------

    async updatePassword(_, { email, edits, password }, context) {
      // Check if a user is authenticated
      if (!context.user) {
        throw new ApolloError("You are not authenticated", "UNAUTHENTICATED", {
          httpStatusCode: 401,
        });
      }

      // Check if the authenticated user is the same as the user whose password is being updated
      if (context.user.email !== email) {
        throw new ApolloError(
          "You are not authorized to do this",
          "UNAUTHORIZED",
          {
            httpStatusCode: 403,
          }
        );
      }

      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError(
            `User with email ${email} does not exist`,
            "NOT_FOUND",
            {
              httpStatusCode: 404,
            }
          );
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          throw new ApolloError("Incorrect password", "UNAUTHORIZED", {
            httpStatusCode: 401,
          });
        }
        const hashedPassword = await bcrypt.hash(edits.password, 10);
        user.password = hashedPassword;
        await user.save();
        return {
          id: user._id,
          email: user.email,
        };
      } catch (error) {
        throw new ApolloError("Failed to update user", "UPDATE_USER_ERROR", {
          httpStatusCode: 500,
        });
      }
    },

    //------------------------------------------------------------------------

    async updateProfile(_, { id, email, edits }) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApolloError("User not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      const profile = await Profile.findOne({ user: user._id });
      if (!profile) {
        throw new ApolloError("Profile not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      const updatedProfile = await Profile.findByIdAndUpdate(profile, edits, {
        new: true,
      });
      if (!updatedProfile) {
        throw new ApolloError(`Profile with ID ${id} not found`, "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      return { ...updatedProfile.toObject(), id: updatedProfile._id };
    },

    //------------------------------------------------------------------------

    async deleteUser(_, { id }) {
      const user = await User.findById(id);
      if (!user) {
        throw new ApolloError(
          `User with ID ${id} does not exist`,
          "NOT_FOUND",
          {
            httpStatusCode: 404,
          }
        );
      }
      // await Profile.findByIdAndDelete(deletedUser.profile);
      await Profile.findOneAndDelete({ user: user._id });
      await User.findByIdAndDelete(id);
      return true;
    },

    //------------------------------------------------------------------------

    async deleteProfile(_, { email }) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApolloError("User not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      const profile = await Profile.findOne({ user: user._id });
      if (!profile) {
        throw new ApolloError("Profile not found", "NOT_FOUND", {
          httpStatusCode: 404,
        });
      }
      await User.findOneAndDelete({ email: user.email });
      await Profile.findByIdAndDelete(profile);
    },

    //---------------------------------------------------------------------
    //product resolvers

    async addProduct(_, { product }) {
      try {
        const processNewProduct = async (product) => {
          const discountedPrice =
            product.originalPrice -
            (product.originalPrice * product.discount) / 100;
          const newProduct = await Product.create({
            discountedPrice,
            ...product,
          });

          // Find the category with matching name
          const category = await Category.findOne({ name: product.category });

          if (!category) {
            throw new ApolloError(
              `Category ${product.category} not found`,
              "NOT_FOUND",
              {
                httpStatusCode: 404,
              }
            );
          }

          // Add the new product to the category's products array
          category.products.push(newProduct);
          await category.save();

          return { id: newProduct._id, ...newProduct.toObject() };
          // else {
          //   //if no discount
          //   const newProduct = await Product.create(product);

          //   // Find the category with matching name
          //   const category = await Category.findOne({ name: product.category });

          //   if (!category) {
          //     throw new ApolloError(
          //       `Category ${product.category} not found`,
          //       "NOT_FOUND",
          //       {
          //         httpStatusCode: 404,
          //       }
          //     );
          //   }

          //   // Add the new product to the category's products array
          //   category.products.push(newProduct);
          //   await category.save();

          //   return { id: newProduct._id, ...newProduct.toObject() };
          // }
        };

        // Call the processNewProduct function
        const newProduct = await processNewProduct(product);
        pubsub.publish("newProduct", { newProduct });
        return newProduct;
      } catch (error) {
        throw error;
      }
    },

    //---------------------------------------------------------------------------------
    async updateProduct(_, { id, edits }) {
      try {
        if (edits && "discount" in edits && "originalPrice" in edits) {
          const discountedPrice =
            edits.originalPrice - (edits.originalPrice * edits.discount) / 100;
          edits.discountedPrice = discountedPrice;

          if (!isNaN(discountedPrice) && isFinite(discountedPrice)) {
            edits.discountedPrice = discountedPrice;
          } else {
            throw new ApolloError(
              "Invalid discountedPrice",
              "INVALID_DISCOUNTED_PRICE",
              {
                httpStatusCode: 400,
              }
            );
          }
        }
        const category = await Category.findOne({ name: edits.category });
        if (!category) {
          throw new ApolloError("category not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const updatedProduct = await Product.findByIdAndUpdate(id, edits, {
          new: true,
        });
        if (!updatedProduct) {
          throw new ApolloError(`User with ID ${id} not found`, "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const oldCategory = await Category.findOne({ products: id });
        if (oldCategory && oldCategory.name !== edits.category) {
          oldCategory.products.pull(id);
          await oldCategory.save();
        }

        // Update product in the new category
        if (!category.products.includes(updatedProduct._id)) {
          category.products.push(updatedProduct._id);
          await category.save();
        }
        return {
          ...updatedProduct.toObject(),
          id: updatedProduct._id,
          discountedPrice: edits.discountedPrice,
        };
      } catch (error) {
        console.log("error", error);
        throw error;
      }
    },
    //------------------------------------------------------------------------------------

    async deleteProduct(_, { id }) {
      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        throw new ApolloError(
          `Product with ID ${id} does not exist`,
          "NOT_FOUND",
          {
            httpStatusCode: 404,
          }
        );
      }
      return true;
    },

    //------------------------------------------------------------------------------------

    async addToFavourites(_, { email, productId }, context) {
      if (!context.user) {
        throw new ApolloError("You are not authenticated", "UNAUTHENTICATED", {
          httpStatusCode: 401,
        });
      }

      // Check if the authenticated user is the same as the user whose password is being updated
      if (context.user.email !== email) {
        throw new ApolloError(
          "You are not authorized to do this",
          "UNAUTHORIZED",
          {
            httpStatusCode: 403,
          }
        );
      }
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        if (profile.favourites.includes(productId)) {
          profile.favourites.pull(productId);
        }
        profile.favourites.push(productId);
        await profile.save();

        return true;
      } catch (error) {
        console.log("error", error);
        throw error;
      }
    },

    //------------------------------------------------------------------------------------

    // async removeFromFavourites(_, { email, productId }) {
    //   try {
    //     const user = await User.findOne({ email });
    //     if (!user) {
    //       throw new ApolloError("User not found", "NOT_FOUND", {
    //         httpStatusCode: 404,
    //       });
    //     }
    //     const profile = await Profile.findOne({ user: user._id });
    //     if (!profile) {
    //       throw new ApolloError("Profile not found", "NOT_FOUND", {
    //         httpStatusCode: 404,
    //       });
    //     }
    //     if (profile.favourites.includes(productId)) {
    //       profile.favourites.pull(productId);
    //     } else {
    //       throw new ApolloError("Product not in favourites", "NOT_FOUND", {
    //         httpStatusCode: 404,
    //       });
    //     }
    //     await profile.save();
    //     return {
    //       id: profile._id,
    //       ...profile.toObject(),
    //     };
    //   } catch (error) {
    //     throw new ApolloError(
    //       "failed to add to favourites",
    //       "ADD_TO_FAVOURITES_ERROR",
    //       { httpStatusCode: 500 }
    //     );
    //   }
    // },

    //------------------------------------------------------------------------------------

    async addToCart(_, { email, productId }) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        if (profile.cart.includes(productId)) {
          throw new ApolloError("Product already in cart", "DUPLICATE", {
            httpStatusCode: 409,
          });
        }
        profile.cart.push(productId);
        await profile.save();
        return {
          id: profile._id,
          ...profile.toObject(),
        };
      } catch (error) {
        throw new ApolloError(
          "failed to add to cart",
          "ADD_TO_FAVOURITES_ERROR",
          { httpStatusCode: 500 }
        );
      }
    },

    //------------------------------------------------------------------------------------

    async removeFromCart(_, { email, productId }) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          throw new ApolloError("Profile not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        if (profile.cart.includes(productId)) {
          profile.cart.pull(productId);
        } else {
          throw new ApolloError("Product not in cart", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        await profile.save();
        return {
          id: profile._id,
          ...profile.toObject(),
        };
      } catch (error) {
        throw new ApolloError("failed to add to cart", "ADD_TO_CART_ERROR", {
          httpStatusCode: 500,
        });
      }
    },

    //------------------------------------------------------------------------------------

    async addReview(_, { reviews }) {
      try {
        const profile = await Profile.findById(reviews.profileId);

        if (!profile) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const product = await Product.findById(reviews.productId);
        if (!product) {
          throw new ApolloError("Product not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const newReview = await Review.create({
          ...reviews,
          profile: profile._id,
          product: product._id,
        });
        await newReview.save();
        profile.reviews.push(newReview);
        profile.save();

        product.reviews.push(newReview);
        product.save();
        return { id: newReview._id, ...newReview.toObject() };
      } catch (error) {
        console.log("error", error);
        throw new ApolloError("Failed to add review", "ADD_REVIEW_ERROR", {
          httpStatusCode: 500,
        });
      }
    },

    //------------------------------------------------------------------------------------

    async updateReview(_, { id, email, productId, edits }) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ApolloError("User not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const profile = await Profile.findOne({ user: user._id });
        const product = await Product.findById(productId);
        if (!product) {
          throw new ApolloError("Product not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }
        const updatedReview = await Review.findByIdAndUpdate(id, edits, {
          new: true,
        });
        if (!updatedReview) {
          throw new ApolloError(`Review with ID ${id} not found`, "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }

        await profile.updateOne(
          { reviews: updatedReview.toString() },
          { $pull: { reviews: id } }
        );
        await product.updateOne(
          { reviews: updatedReview.toString() },
          { $pull: { reviews: id } }
        );
        await updatedReview.save();
        return { ...updatedReview.toObject(), id: updatedReview._id };
      } catch (error) {
        console.log("error", error);
        throw new ApolloError(
          "Failed to update review",
          "UPDATE_REVIEW_ERROR",
          {
            httpStatusCode: 500,
          }
        );
      }
    },

    //------------------------------------------------------------------------------------
    async deleteReview(_, { id }) {
      try {
        const review = await Review.findById(id);
        if (!review) {
          throw new ApolloError("Review not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }

        // Remove the review ID from the associated product's reviews array
        await Product.updateOne(
          { _id: review.product },
          { $pull: { reviews: id } }
        );

        // Remove the review ID from the associated profile's reviews array
        await Profile.updateOne(
          { _id: review.profile },
          { $pull: { reviews: id } }
        );

        // Delete the review
        await Review.findByIdAndDelete(id);

        return true;
      } catch (error) {
        console.log("error", error);
        throw new ApolloError(
          "Failed to delete review",
          "DELETE_REVIEW_ERROR",
          {
            httpStatusCode: 500,
          }
        );
      }
    },

    //------------------------------------------------------------------------------------

    async addCategory(_, { category }) {
      try {
        // Create a new category
        const newCategory = await Category.create(category);
        const populatedCategory = await Category.findById(
          newCategory._id
        ).populate("products");

        return populatedCategory;
      } catch (error) {
        console.log("error", error);
        throw new ApolloError("Failed to add category", "ADD_CATEGORY_ERROR", {
          httpStatusCode: 500,
        });
      }
    },

    //------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------

    async removeCategory(_, { id }) {
      try {
        const category = await Category.findById(id);
        if (!category) {
          throw new ApolloError("Category not found", "NOT_FOUND", {
            httpStatusCode: 404,
          });
        }

        await Product.updateMany(
          { category: category.name },
          { $pull: { category: category.name } }
        );

        await Category.findByIdAndDelete(id);
      } catch (error) {
        throw new ApolloError(
          "Failed to delete category",
          "DELETE_CATEGORY_ERROR",
          { httpStatusCode: 500 }
        );
      }
    },
  },
  Subscription: {
    newProduct: {
      subscribe: () => pubsub.asyncIterator("newProduct"),
    },
  },
};
module.exports = resolvers;
