const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const GallerySchema = new Schema({
  name: { type: String, maxLength: 200, required: true },
  description: { type: String, maxLength: 500 },
  date: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }
});
// Export model
module.exports = mongoose.model("Gallery", GallerySchema); 