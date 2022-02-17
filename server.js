const express = require('express')
const app = express();
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))
const PORT = process.env.PORT || 3000;
const http = require('http')
const server = http.createServer(app)
const socketIO = require('socket.io', {
    cors: {
        origin: ["*:*"]
    }
})
const io = socketIO(server)
server.listen(PORT, () => console.log(`Server running on ${PORT}`))
let connectedPlayers = 0
let users = {}
io.on('connection', socket => {
    connectedPlayers ++; 
    if(connectedPlayers>2){
        socket.emit("too-many-users")
        socket.disconnect();
    }
    console.log(socket.id)
})