var mongoose = require("mongoose");
var Profile = mongoose.Schema({
    firstname: {
        type: String,
        required: false,
        default: "Firstname"
    },
    lastname: {
        type: String,
        required: false,
        default: "Lastname"
    },
    status: {
        type: String,
        required: false,
        default: "My status"
    },
    image: {
        type: String,
        required: false,
        default: "/images/profile/profile-default.jpg"
    },
    backgroundImage: {
        type: String,
        required: false,
        default: "/images/stars_space_glow_planet_99744_1920x1080.jpg"
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { versionKey: false });

module.exports = mongoose.model("Profile", Profile);