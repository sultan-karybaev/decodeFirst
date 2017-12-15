var express = require("express");
var router = express.Router();

var Post = require("../models/Post");

router.get("/api/posts/:page", function (req, res, next) {
    Post.count()
        .exec(function (err, count) {
            if (err) return res.sendStatus(401).end();
            Post.find().skip(req.params.page * 6).limit(6).populate('author')
                .exec(function (err, posts) {
                    if (err) return res.sendStatus(400).end();
                    console.log("COUNT");
                    console.log(count);
                    res.send({count: Math.ceil(count/6), posts: posts});
                });
        });

});

module.exports = router;