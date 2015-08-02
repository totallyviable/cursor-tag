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
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data){
        console.log(data);
    });
});
