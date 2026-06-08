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
        
        // Notify both users in the room that the peer-to-peer link is established
        io.to(sessionId).emit('peer-connected');
    });

    // 1. Text changes
    socket.on('text-update', (data) => {
        // Relays the entire payload (filePath + content) to everyone except sender
        socket.to(data.sessionId).emit('text-receive', data);
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

    
    // 6. Disconnect from session room
    socket.on('leave-session', (data) => {
        socket.to(data.sessionId).emit('session-ended');
        socket.leave(data.sessionId);
        console.log(`[SERVER] Client left session: ${data.sessionId}`);
    });

        // 7. Chat Message Relay
    socket.on('chat-message-send', (data) => {
        // data = { sessionId, sender, text }
        io.to(data.sessionId).emit('chat-message-receive', {
            sender: data.sender,
            text: data.text
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
});