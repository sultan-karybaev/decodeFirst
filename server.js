var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var fs  = require("fs");
var multer = require("multer");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var sizeOf = require("image-size");

//Адрес хранения картинок
var upload = multer({dest: "public/images/content"});

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test");

var app = express();

//our models
var Post = require("./server/models/Post");
var Profile = require("./server/models/Profile");
var Pin = require("./server/models/Pin");
var User = require("./server/models/User");
var Comment = require("./server/models/Comment");
var Like = require("./server/models/Like");



app.set("port", process.env.PORT || 3000);

app.use(logger("dev"));
app.use(bodyParser.json({limit: "50mb"}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({limit: "50mb", extended: true}));
app.use(express.static(path.join(__dirname, "public"), {maxAge: 1}));
app.use(session({
    secret: 'your secret here',
    resave:  true,
    saveUninitialized: true,
    key: 'jsessionid',
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

passport.use(new LocalStrategy({ usernameField: 'email' },
    function( email, password, done) {
        User.findOne({ email: email }).exec(function(err, user) {
            if (err) return done(err);
            if (!user) return done(null, false);
            user.comparePassword(password, function(err, isMatch) {
                if (err) return done(err);
                if (isMatch) return done(null, user);
                return done(null, false);
            });
        });
    }));


passport.serializeUser(function(user, done) {
    console.log("serializeUser", user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id).exec(function(err, user) {
        console.log("deserializeUser", user);
        done(err, user);
    });
});

app.use(passport.initialize());
app.use(passport.session());


app.post('/api/login', passport.authenticate('local'), function(req, res, next) {
    res.cookie("sessionID", req.sessionID);
    //res.sendStatus(200);
    res.send(req.user);
});

app.post('/api/logout', function(req, res, next) {
    req.logout();
    res.clearCookie("sessionID");
    res.sendStatus(200);
});

//ctrl.signup passport.authenticate('local'),
app.post("/api/signup",  function (req, res, next) {

    if(!req.body.email) return res.sendStatus(400).end();

    var user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    User.findOne({email: req.body.email})
        .exec(function (err, profile) {
            if (err) return res.sendStatus(400).end();
            if (!profile){
                user.save(function (err, savedata) {
                    if (err) return res.sendStatus(400).end();
                    res.cookie("sessionID", req.sessionID);
                    res.send(savedata);
                })
            } else {
                res.sendStatus(400).end();
            }
        });
});
//------------------------------

app.get("/api/user", function (req, res, next) {
    console.log(req.user);
    res.send(req.user);
});

//ctrl.header
app.get("/api/search/:text", function (req, res, next) {
    Post.find({$or:[{title: new RegExp(req.params.text, "i")}, {content: new RegExp(req.params.text, "i")}]})
        .exec(function (err, posts) {
            if (err) return res.sendStatus(400).end();
            res.send(posts);
        });
});

//ctrl.post
app.get("/api/post/:id", function (req, res, next) {
    Post.findById(req.params.id).populate("author")
        .exec(function (err, post) {
            res.send(post);
        });
});

app.get("/api/get/commentsPost/:id", function (req, res, next) {
    Comment.find({post: req.params.id}).populate("author")
        .exec(function (err, comments) {
            if (err) return res.sendStatus(400).end();
            res.send(comments);
        });
});

app.post("/api/post/comment", function (req, res, next) {
    console.log(req.body);
    var comment = new Comment({
        title: req.body.title
    });
    User.findById(req.session.passport.user)
        .exec(function (err, user) {
            if (err) return console.log(err);
            comment.author = user._id;
            comment.post = req.body.postID;
            comment.save(function (err, savedComment) {
                if (err) return res.sendStatus(400).end();
                Comment.findById(savedComment._id).populate("author")
                    .exec(function (err, comment) {
                        if (err) return res.sendStatus(400).end();
                        res.send(comment);
                    });
            });
        });
});

//ctrl.home

app.use(require("./server/routes/post"));

// app.get("/api/posts/:page", function (req, res, next) {
//     Post.count()
//         .exec(function (err, count) {
//             if (err) return res.sendStatus(401).end();
//             Post.find().skip(req.params.page * 6).limit(6).populate('author')
//                 .exec(function (err, posts) {
//                     if (err) return res.sendStatus(400).end();
//                     console.log("COUNT");
//                     console.log(count);
//                     res.send({count: Math.ceil(count/6), posts: posts});
//                 });
//         });
//
// });

app.post("/api/post", upload.single("image"), function (req, res, next) {
    var post = new Post({
        title: req.body.title,
        content: req.body.content,
        likes: 0
    });

    User.findById(req.session.passport.user)
        .exec(function (err, user) {
            if (err) return res.sendStatus(400).end();
            post.author = user._id;
            console.log("req.file");
            console.log(req.file);

            if(!req.file){
                console.log("NOT file");
                post.image = "/images/content/post-default.jpg";
                post.save(function (err, savedPost) {
                    if (err) return res.sendStatus(400).end();
                    user.posts.push(savedPost);
                    user.save(function (err) {
                        if (err) return res.sendStatus(400).end();
                    });
                    Post.findById(savedPost._id).populate("author")
                        .exec(function (err, post) {
                            if (err) return res.sendStatus(400).end();
                            res.send(post);
                        });
                });
            } else {
                console.log("FILE");
                var tempPATH = req.file.path;
                console.log(req.file.path);
                var targetPATH = path.resolve("public/images/content/" + post._id + "." + req.file.originalname.split(".").slice(-1).pop());
                post.image = "/images/content/" +  post._id + "." + req.file.originalname.split(".").slice(-1).pop();
                fs.rename(tempPATH, targetPATH, function (err) {
                    if (err) return res.sendStatus(400).end();
                    post.save(function (err, savedPost) {
                        if (err) return res.sendStatus(400).end();
                        sizeOf(targetPATH, function (err, dimensions) {
                            if (err) return console.log(err);
                            console.log("WIDTH and HEIGHT");
                            console.log(dimensions.width, dimensions.height);
                        });
                        user.posts.push(savedPost);
                        user.save(function (err) {
                            if (err) return res.sendStatus(400).end();
                        });
                        Post.findById(savedPost._id).populate("author")
                            .exec(function (err, post) {
                                if (err) return res.sendStatus(400).end();
                                res.send(post);
                            });
                    });
                });
            }
        });
});

app.delete("/api/delete/post/:id", function (req, res, next) {
    Post.remove({_id: req.params.id}, function (err) {
        if (err) return res.status(400).end();
        console.log("We deleted your post");
        Comment.remove({post: req.params.id}, function (err) {
            if (err) return res.sendStatus(400).end();
            res.sendStatus(200);
        });
        })
        .then(function () {
            console.log("function THEN");
        })
        .catch(function (err){
            console.log(err);
        });
});

app.put("/api/put/:id", upload.single("image"), function (req, res, next) {
    Post.findById(req.params.id).populate("author")
        .exec(function (err, post) {
            if (err) return res.sendStatus(400).end();
        post.title = req.body.title;
        post.content = req.body.content;

        if(!req.file){
            post.save(function (err) {
                if (err) return res.sendStatus(400).end();
                res.send(post);
            });
        } else {
            var tempPATH = req.file.path;
            var targetPATH = path.resolve("public/images/content/" + post._id + "." + req.file.originalname.split(".").slice(-1).pop());
            post.image = "/images/content/" +  post._id + "." + req.file.originalname.split(".").slice(-1).pop();
            fs.rename(tempPATH, targetPATH, function (err) {
                if(err) return console.log(err);

                post.save(function (err) {
                    if (err) return res.sendStatus(400).end();
                    res.send(post);

                });
            });
        }

    });
});

// app.get("/api/get/likedPosts", function (req, res, next) {
//     Like.find({user: req.session.passport.user})
//         .exec(function (err, likes) {
//             if (err) return res.sendStatus(400).end();
//             res.send(likes);
//         });
// });
//
app.get("/api/get/liked/:id", function (req, res, next) {
    Like.findOne({user: req.session.passport.user, post: req.params.id})
        .exec(function (err, like) {
            if (err) return res.sendStatus(400).end();
            if (like){
                res.send(true);
            } else {
                res.send(false);
            }
        });
});

app.post("/api/post/like", function (req, res, next) {
    User.findById(req.session.passport.user)
        .exec(function (err, user) {
            if (err) return res.sendStatus(400).end();
            Post.findById(req.body.postID)
                .exec(function (err, post) {
                    if (err) return res.sendStatus(400).end();
                    var like = new Like({
                        user: user._id,
                        post: req.body.postID
                    });
                    ++post.likes;
                    post.save(function (err) {
                        if (err) return res.sendStatus(400).end();
                        like.save(function (err) {
                            if (err) return res.sendStatus(400).end();
                            res.sendStatus(200);
                        });
                    });

                });
        });
});

app.delete("/api/delete/like/:id", function (req, res, next) {
    Like.remove({user: req.session.passport.user, post: req.params.id}, function (err) {
        if (err) return res.status(400).end();
        Post.findById(req.params.id)
            .exec(function (err, post) {
                if (err) return res.sendStatus(400).end();
                --post.likes;
                post.save(function (err) {
                    if (err) return res.sendStatus(400).end();
                    res.sendStatus(200);
                });

            });
    });
});

//ctrl.profile
app.get("/api/get/profile", function (req, res, next) {
    console.log("SESSION");
    console.log(req.session.passport.user);
    User.findById(req.session.passport.user).populate('posts')
        .exec(function (err, profile) {
            if (err) return res.sendStatus(400).end();
            res.send(profile);
            // profile.posts.forEach(function (post, index, arr) {
            //     Like.findOne({user: req.session.passport.user, post: post._id})
            //         .exec(function (err, like) {
            //             if (err) return res.sendStatus(400).end();
            //             if (like){
            //                 console.log("TRUE");
            //                 arr[index].liked = true;
            //             } else {
            //                 console.log("FALSE");
            //             }
            //             if (index === profile.posts.length - 1){
            //                 console.log(profile);
            //                 res.send(profile);
            //             }
            //         });
            // });
        });
});

app.get("/api/get/commentsProfile", function (req, res, next) {
    Comment.find({author: req.session.passport.user}).populate("post")
        .exec(function (err, comments) {
            if(err) return res.sendStatus(400).end();
            res.send(comments);
        });
});


//ctrl.author
app.get("/api/get/author/:id", function (req, res, next) {
    User.findById(req.params.id).populate('posts')
        .exec(function (err, author) {
            console.log(author);
            if (err) return res.sendStatus(400).end();
            res.send(author);
            // author.posts.forEach(function (post, index, arr) {
            //     Like.findOne({user: req.session.passport.user, post: post._id})
            //         .exec(function (err, like) {
            //             if (err) return res.sendStatus(400).end();
            //             if (like){
            //                 console.log("TRUE");
            //                 arr[index].liked = true;
            //             } else {
            //                 console.log("FALSE");
            //             }
            //             if (index === author.posts.length - 1){
            //                 console.log(author);
            //                 res.send(author);
            //             }
            //         });
            // });
        });
});

app.get("/api/get/commentsAuthor/:id", function (req, res, next) {
    Comment.find({author: req.params.id}).populate("post")
        .exec(function (err, comments) {
            if(err) return res.sendStatus(400).end();
            res.send(comments);
        });
});

//ctrl.interest
app.get("/api/pins", function (req, res, next) {
    Pin.find()
        .exec(function (err, pins) {
            if(err) return res.status(400).end();
            res.send(pins);
        });
});

app.get('*', function(req, res, next) {
    console.log(req.url);
    if(req.url === "/login" || req.url === "/signup"){
        if(req.cookies.userID){
            res.redirect('/');
        }
    }
    res.redirect('/#' + req.originalUrl);
});



var server = app.listen(app.get("port"), function () {
    console.log("Express server listening on port " + app.get("port"));
});

var io = require("socket.io")();
io.attach(server);
var socketEvents = require("./server/socket");
socketEvents(io);