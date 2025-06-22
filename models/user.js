const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: { type: String, maxLength: 50, required: true, unique: true },
  name: { type: String, maxLength: 100, required: true },
  surname: { type: String, maxLength: 100, required: true },
  password: { type: String, required: true }
});
// Export model
module.exports = mongoose.model("User", UserSchema);