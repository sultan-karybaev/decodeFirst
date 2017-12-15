var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var schema = mongoose.Schema;
var User = mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    password: String,

    posts: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Post"
    }]
});

User.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

User.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model("User", User);