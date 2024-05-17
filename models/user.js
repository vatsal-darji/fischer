const { mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
  id: String,
  email: {
    type: String,
    unique: [true, "Email already exists"],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: String,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
