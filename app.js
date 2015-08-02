var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT);

console.log('==================================================');
console.log('HTTP server listening on port %d', process.env.PORT);
console.log('==================================================');

app.use(express.static(__dirname + '/public'));

var clients = {};

io.on('connection', function (socket){
    clients[socket.id] = socket;

    socket.emit('player_count', {
        count: Object.keys(clients).length
    });

    socket.broadcast.emit('player_count', {
        count: Object.keys(clients).length
    });

    socket.on('cursor_position', function(data){
        socket.volatile.broadcast.emit('cursor_position', {
            client_id: socket.id,
            position: data
        });
    });

    socket.on('cursor_click', function(data){
        var to_client = clients[data.client_id];

        if (! to_client) return;

        to_client.emit('cursor_tagged', {
            from_client_id: socket.id
        })
    });

    socket.on('disconnect', function (){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });

        delete clients[socket.id];

        socket.broadcast.emit('player_count', {
            count: Object.keys(clients).length
        });
    });
});
