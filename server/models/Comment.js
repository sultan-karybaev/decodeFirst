var mongoose = require("mongoose");
var Comment = mongoose.Schema({
    title: String,
    post: {type: mongoose.Schema.Types.ObjectId, ref: "Post"},
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
});

module.exports = mongoose.model("Comment", Comment);