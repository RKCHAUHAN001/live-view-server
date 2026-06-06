// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log(`[SERVER] Connected: ${socket.id}`);

    socket.on('create-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`[SERVER] Session created: ${sessionId}`);
    });

    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`[SERVER] Guest joined session: ${sessionId}`);
    });

    // 1. Text changes
    socket.on('text-update', (data) => {
        socket.to(data.sessionId).emit('text-receive', { content: data.content });
    });

    // 2. Cursor Coordinates
    socket.on('cursor-send', (data) => {
        socket.to(data.sessionId).emit('cursor-receive', data);
    });

    // 3. Permissions changes
    socket.on('permission-send', (data) => {
        socket.to(data.sessionId).emit('permission-receive', data);
    });

    // 4. File lists
    socket.on('file-list-send', (data) => {
        socket.to(data.sessionId).emit('file-list-receive', data.files);
    });

    // 5. File read requests
    socket.on('request-file-send', (data) => {
        socket.to(data.sessionId).emit('request-file-receive', data.filePath);
    });

    socket.on('disconnect', () => {
        console.log(`[SERVER] Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
});