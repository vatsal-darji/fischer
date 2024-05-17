const mongoose = require("mongoose");
const MONGO_URL = "mongodb://localhost:27017/fischer";

const connectDB = () => {
  mongoose
    .connect(MONGO_URL)
    .then(console.log("mongoDB connected"))
    .catch((err) => console.log(err));
};

module.exports = connectDB;
