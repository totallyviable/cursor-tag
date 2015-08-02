var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT);

console.log('==================================================');
console.log('HTTP server listening on port %d', process.env.PORT);
console.log('==================================================');

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket){
    socket.on('cursor_position', function(data){
        socket.volatile.broadcast.emit('cursor_position', {
            client_id: socket.id,
            position: data
        });
    });

    socket.on('disconnect', function (){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });
    });
});
