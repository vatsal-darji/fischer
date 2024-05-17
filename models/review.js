const { mongoose } = require("mongoose");

const reviewSchema = new mongoose.Schema({
  id: String,
  rating: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
