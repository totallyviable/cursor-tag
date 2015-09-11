// require('newrelic');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var stathat = require('stathat');
var _ = require('underscore');

server.listen(process.env.PORT);

console.log('==================================================');
console.log('HTTP server listening on port %d', process.env.PORT);
console.log('==================================================');

app.use(express.static(__dirname + '/public'));

app.get('/about', function (req, res){
    res.sendFile(__dirname + '/public/about.html');
});

function count_stat(name, value){
    return;
    return stathat.trackEZCount(process.env.STATHAT_KEY, "cursortag." + process.env.ENVIRONMENT + "." + name, value, function(status, json) {});
}

function value_stat(name, value){
    return;
    return stathat.trackEZValue(process.env.STATHAT_KEY, "cursortag." + process.env.ENVIRONMENT + "." + name, value, function(status, json) {});
}

var active_clients = {};

setInterval(function(){
    io.emit('player_count', Object.keys(active_clients).length);
}, 1000);

setInterval(function(){
    var positions = {};

    _.each(active_clients, function(client, key){
        if (! client.paused) {
            positions[key] = client.current_position;
        }
    });

    io.emit('player_positions', positions);
}, 25);

io.on('connection', function (socket){
    socket.on('activate_webcam', function(data){
        active_clients[socket.id] = socket;

        socket.paused = false;

        io.emit('player_count', Object.keys(active_clients).length);

        count_stat("activate_webcam", 1);
        value_stat("player_count", Object.keys(active_clients).length);
    });

    socket.on('cursor_position', function(data){
        if (socket.paused) return;
        socket.current_position = data;
    });

    socket.on('cursor_click', function(data){
        var victim_client = active_clients[data.victim_client_id];

        if (! victim_client) return;

        if (victim_client.paused) return;

        victim_client.emit('request_webcam_frame', {
            victim_client_id: data.victim_client_id,
            opponent_client_id: socket.id
        });
    });

    socket.on('send_webcam_frame', function(data){
        var opponent_client = active_clients[data.opponent_client_id];

        if (! opponent_client) return;

        opponent_client.emit('receive_webcam_frame', data);

        count_stat("webcam_frame", 1);
    });

    socket.on('paused', function(data){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });

        if (active_clients[socket.id]) delete active_clients[socket.id];

        socket.paused = true;
    });

    socket.on('disconnect', function (){
        io.emit('cursor_disconnect', {
            client_id: socket.id
        });

        if (active_clients[socket.id]) delete active_clients[socket.id];

        io.emit('player_count', Object.keys(active_clients).length);

        value_stat("player_count", Object.keys(active_clients).length);
    });
});
