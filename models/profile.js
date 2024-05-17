const { mongoose } = require("mongoose");

const profileSchema = new mongoose.Schema({
  id: String,
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  contactNo: {
    type: String,
    unique: [true, "Contact number already exists"],
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  favourites: {
    type: [String],
  },
  cart: {
    type: [String],
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Profile = mongoose.model("Profile", profileSchema);
module.exports = Profile;
