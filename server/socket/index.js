module.exports = function (io) {
    io.sockets.on("connection", function (socket) {
        // console.log("SOCKETS " + i++);

        socket.on("enterRoom", function (data) {
            console.log(data);
            socket.room = data.room;
            socket.user = data.username;
            socket.join(socket.room);
            socket.emit("updateRoom", "SERVER", "you have joined to " + socket.room);
            socket.broadcast.to(socket.room).emit("updateRoom", "SERVER", socket.user + " has joined to this room");
        });

        socket.on("sendMsg", function (data) {
            socket.emit("updateRoom", data.author, data.msg);
            socket.broadcast.to(socket.room).emit("updateRoom", data.author, data.msg);
        });

        socket.on("changeRoom", function (data) {
            socket.broadcast.to(socket.room).emit("updateRoom", "SERVER", socket.user + " leave this room");
            socket.leave(socket.room);
            socket.room  = data.room;
            socket.join(socket.room);
            socket.emit("updateRoom", "SERVER", "you have joined to " + socket.room);
            socket.broadcast.to(socket.room).emit("updateRoom", "SERVER", socket.user + " has joined to this room");
        });
        
        socket.on("addPost", function (data) {
            socket.emit("putpost", data);
            socket.broadcast.emit("putpost", data);
        });

        socket.on("deletePost", function (post) {
            socket.emit("removepost", post);
            socket.broadcast.emit("removepost", post);
        });
    });
};