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
let userIds = []
let current = "";
let isSessionOn = false;
let board = new Map([
    [1, ""],
    [2, ""],
    [3, ""],
    [4, ""],
    [5, ""],
    [6, ""],
    [7, ""],
    [8, ""],
    [9, ""]
]);
const possibleWinnings = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [1, 5, 9],
    [3, 5, 7],
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9]
]

function checkForWin(user) {
    let win = false
    const userBoxes = user.boxes.sort()
    console.log(userBoxes)
    for(let i = 0;i<possibleWinnings.length;i++) {
        let allExists = true
        possibleWinnings[i].forEach(function(place){
            if(userBoxes.indexOf(place)==-1){
                allExists = false
            }
        })
        if(allExists){
            win = true
            break 
        }
    }
    return win
}

function allSet() {
    // console.log(board)
    let allSet = true
    const values = Array.from(board.values());
    for (let i = 0; i < values.length; i++) {
        if (values[i] == "") {
            allSet = false
        }
    }
    return allSet;
}

function reset() {
    board = board = new Map([
        [1, ""],
        [2, ""],
        [3, ""],
        [4, ""],
        [5, ""],
        [6, ""],
        [7, ""],
        [8, ""],
        [9, ""]
    ]);
    console.log("reset")
    isSessionOn = false
    userIds = []
    users = {}
    resetSockets()
}

function resetSockets() {
    const clients = io.sockets.sockets;
    clients.forEach(function (c) {
        c.disconnect();
    });
}
setTimeout(() => {
    const clients = io.sockets.sockets;
    clients.forEach(function (c) {
        if (!c.connected) {
            delete users[c.id]
            c.disconnect();
        }
    })
}, 10000)
io.on('connection', socket => {
    if (connectedPlayers >= 2) {
        socket.emit("too-many-users")
        console.log('disc')
        socket.disconnect();
    } else {
        connectedPlayers++;
        console.log(socket.id)
        if (connectedPlayers == 1) {
            users[socket.id] = {
                mark: "sph",
                blocked: true,
                boxes: []
            }
        } else {
            users[socket.id] = {
                mark: "x",
                blocked: true,
                boxes: []
            }
        }
        socket.emit("mark-given", users[socket.id].mark)
        userIds.push(socket.id)
    }
    if (connectedPlayers < 2) {
        socket.emit("waiting-for-player")
    } else {
        var randId = userIds[Math.floor(Math.random() * userIds.length)];
        users[randId].blocked = false
        io.emit("game-started", randId)
        isSessionOn = true
    }
    socket.on("clicked", boxId => {
        if (board.get(Number(boxId)) == "" && !(users[socket.id].blocked)) {
            board.set(Number(boxId), users[socket.id].mark)
            socket.broadcast.emit('box-marked', {
                id: boxId,
                mark: users[socket.id].mark
            })
            socket.broadcast.emit('your-turn');
            socket.emit('blocked')
            users[socket.id].blocked = true
            users[socket.id].boxes.push(Number(boxId))
            if (checkForWin(users[socket.id])) {
                socket.emit("you-won")
                socket.broadcast.emit('other-player-won')
                setTimeout(() => {
                    io.emit('game-ended')
                }, 2000);
            } else if (allSet()) {
                socket.emit("draw");
                socket.broadcast.emit('draw')
                setTimeout(() => {
                    io.emit('game-ended')
                }, 2000);
            }
        }
    })
    socket.on("unblock-me", () => {
        users[socket.id].blocked = false
    })
    socket.on("first-one", () => {
        socket.broadcast.emit('blocked')
    })
    socket.on("player-left-after-game", () => {
        resetSockets();
    })
    socket.on("disconnect", () => {
        connectedPlayers--;
        delete userIds[userIds.indexOf(socket.id)]
        console.log("disconnect")
        if (connectedPlayers == 0) {
            reset();
        }
        if (connectedPlayers == 1 && isSessionOn) {
            socket.broadcast.emit("you-won-other-left")
            setTimeout(() => {
                io.emit('game-ended')
            }, 2000);
            reset();
        }
    })
    console.log(connectedPlayers)
})