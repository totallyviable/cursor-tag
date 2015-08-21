var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT);

console.log('==================================================');
console.log('HTTP server listening on port %d', process.env.PORT);
console.log('==================================================');

app.use(express.static(__dirname + '/public'));

var active_clients = {};

io.on('connection', function (socket){
    socket.on('activate_webcam', function(data){
        active_clients[socket.id] = socket;

        socket.emit('player_count', {
            count: Object.keys(active_clients).length
        });

        socket.broadcast.emit('player_count', {
            count: Object.keys(active_clients).length
        });
    });

    socket.on('cursor_position', function(data){
        socket.volatile.broadcast.emit('cursor_position', {
            client_id: socket.id,
            position: data
        });
    });

    socket.on('cursor_click', function(data){
        var victim_client = active_clients[data.victim_client_id];

        if (! victim_client) return;

        victim_client.emit('request_webcam_frame', {
            victim_client_id: data.victim_client_id,
            opponent_client_id: socket.id
        });
    });

    socket.on('send_webcam_frame', function(data){
        var opponent_client = active_clients[data.opponent_client_id];

        if (! opponent_client) return;

        opponent_client.emit('receive_webcam_frame', data);
    });

    socket.on('disconnect', function (){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });

        if (active_clients[socket.id]) {
            delete active_clients[socket.id];

            socket.broadcast.emit('player_count', {
                count: Object.keys(active_clients).length
            });
        }
    });
});
