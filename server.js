const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS allowed so your VS Code extension can connect
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Object to track active sharing sessions and their current text states
const sessions = {};

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // When a host starts sharing code or a guest joins a room
    socket.on('start-session', (sessionId) => {
        socket.join(sessionId);
        
        // If the session doesn't exist yet, initialize it
        if (!sessions[sessionId]) {
            sessions[sessionId] = { host: socket.id, currentCode: "" };
        }
        console.log(`Session synchronized/created for Room: ${sessionId}`);
    });

    // When the host types, broadcast changes to everyone in the room
    socket.on('code-update', (data) => {
        // Log trackers to verify data is successfully reaching the server
        console.log(`Server received code update for file: ${data.fileName}`);
        console.log(`Content length: ${data.content.length} characters`);

        if (sessions[data.sessionId]) {
            sessions[data.sessionId].currentCode = data.content;
            
            // Using io.to() sends the data to everyone in the room.
            // This allows you to test both Host and Guest sides inside a single VS Code window!
            io.to(data.sessionId).emit('code-preview', {
                fileName: data.fileName,
                content: data.content
            });
        }
    });

    // Handle user disconnects
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Run the server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Live View Server running on http://localhost:${PORT}`);
});