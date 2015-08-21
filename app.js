var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'polling']);
io.set("polling duration", 10); 

server.listen(process.env.PORT);

console.log('==================================================');
console.log('HTTP server listening on port %d', process.env.PORT);
console.log('==================================================');

app.use(express.static(__dirname + '/public'));

var clients = {};
var active_client_count = 0;

io.on('connection', function (socket){
    clients[socket.id] = socket;

    socket.on('activate_webcam', function(data){
        active_client_count++;

        socket.emit('player_count', {
            count: active_client_count
        });

        socket.broadcast.emit('player_count', {
            count: active_client_count
        });
    });

    socket.on('cursor_position', function(data){
        socket.volatile.broadcast.emit('cursor_position', {
            client_id: socket.id,
            position: data
        });
    });

    socket.on('cursor_click', function(data){
        var victim_client = clients[data.victim_client_id];

        if (! victim_client) return;

        victim_client.emit('request_webcam_frame', {
            victim_client_id: data.victim_client_id,
            opponent_client_id: socket.id
        });
    });

    socket.on('send_webcam_frame', function(data){
        var opponent_client = clients[data.opponent_client_id];

        if (! opponent_client) return;

        opponent_client.emit('receive_webcam_frame', data);
    });

    socket.on('disconnect', function (){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });

        delete clients[socket.id];
        active_client_count--;
        if (active_client_count < 0) active_client_count = 0;

        socket.broadcast.emit('player_count', {
            count: active_client_count
        });
    });
});
