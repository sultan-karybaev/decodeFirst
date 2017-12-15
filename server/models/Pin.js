var mongoose = require("mongoose");
var Pin = mongoose.Schema({
    image: String
}, { versionKey: false });

module.exports = mongoose.model("Pin", Pin);