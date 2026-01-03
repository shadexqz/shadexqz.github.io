const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    // Генерируем цвет один раз при подключении
    const hue = Math.floor(Math.random() * 360);
    players[socket.id] = { 
        x: 300, y: 300, 
        color: `hsl(${hue}, 80%, 60%)`,
        angle: 0,
        hook: { active: false, x: 0, y: 0 }
    };

    socket.emit('init', { id: socket.id, players });
    socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

    socket.on('update', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerUpdated', { id: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeave', socket.id);
    });
});

server.listen(process.env.PORT || 3000);
