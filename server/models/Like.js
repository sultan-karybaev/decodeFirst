var mongoose = require("mongoose");
var Like = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    post: {type: mongoose.Schema.Types.ObjectId, ref: "Post"}
});

module.exports = mongoose.model("Like", Like);