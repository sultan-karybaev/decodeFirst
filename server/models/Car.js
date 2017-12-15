var mongoose = require("mongoose");
var Car = mongoose.Schema({
    mark: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: false,
        default: 2010
    },
    color: {
        type: String,
        required: true
    }
}, { versionKey: false });

module.exports = mongoose.model("Car", Car);