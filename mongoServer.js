var express = require("express");
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test");

var app = express();

//our models
var Pin = require("./server/models/Pin");
var Post = require("./server/models/Post");

var pin = new Pin({
    image: "/images/pin/373c6254cba5be35416a7416fc6f1fd5.jpg"
});

Post.find({})
    .exec(function (err, posts) {
        if (err) return console.log(err);
        posts.forEach(function (t) {
            t.liked = false;
            t.save(function (err) {
                if (err) return console.log(err);
            });
        })
    });

// pin.save(function (err) {
//     if (err) return console.log(err);
//
// })
//     .then(function(doc){
//     console.log("We have successfully saved your object!");
//     Pin.find({}).exec(function (err, posts) {
//         if (err) return console.log(err);
//         //console.log(posts);
//     });
//     //mongoose.disconnect();  // отключение от базы данных
// })
//     .catch(function (err){
//         //console.log(err);
//         //mongoose.disconnect();
//     });


// Profile.remove({_id: "59d8c28d992b071d30607bf2"}, function (err) {
//     if (err) return res.status(400).end();
//     console.log("We deleted your post");
// });
