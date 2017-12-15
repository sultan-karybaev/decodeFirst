var mongoose = require("mongoose");
var Post = mongoose.Schema({
    title: String,
    content: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    image: String,
    likes: Number,
    liked: Boolean
});

module.exports = mongoose.model("Post", Post);