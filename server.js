const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Required for Electron cross-origin requests
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('msg', (data) => io.emit('msg', data));
    socket.on('offer', (data) => socket.broadcast.emit('offer', data));
    socket.on('answer', (data) => socket.broadcast.emit('answer', data));
    socket.on('ice', (data) => socket.broadcast.emit('ice', data));
});

http.listen(3000, () => {
    console.log('Nype Server active on port 3000');
});