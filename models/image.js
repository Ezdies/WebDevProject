const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  name: { type: String, maxLength: 200, required: true },
  description: { type: String, maxLength: 500 },
  path: { type: String, required: true },
  gallery: { type: Schema.Types.ObjectId, ref: "Gallery", required: true },
  uploadDate: { type: Date, default: Date.now }
});
// Export model
module.exports = mongoose.model("Image", ImageSchema); 