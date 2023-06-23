const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const roomPlayers = new Map()
const roomStatus = new Map()

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.emit('connection');

  socket.on('joinRoom', async (name, room) => {
    if (!roomPlayers.has(room)) {
      const emptyArray = []
      roomPlayers.set(room, emptyArray);
      roomStatus.set(room, "Waiting");
    }
    
    let start = false;

    const temp = await io.in(room).fetchSockets();
    const playerCount = temp.length;
    players = roomPlayers.get(room);
    duelStatus = roomStatus.get(room);

    console.log(name + " sent request to join " + room + " with room status " + duelStatus);

    if (duelStatus == "Initialized") {
      socket.emit('startDuel', players[0], players[1]);
    } else if (duelStatus == "Waiting") {
      if (playerCount > 1) {
        console.log(`${name}'s request to join room ${room} rejected (ROOM FULL)`);
        socket.emit('roomFull');
        return;
      } else if (playerCount == 0) {
        console.log(`${name}'s request to join room ${room} accepted (FIRST PLAYER)`);
        socket.join(room);
        socket.emit('joinedRoom');
  
        players.push({
          id: socket.id,
          name: name,
          room: room
        });
      } else {
        console.log(`${name}'s request to join room ${room} accepted (SECOND PLAYER)`);
        socket.join(room);
        socket.emit('joinedRoom');
  
        players.push({
          id: socket.id,
          name: name,
          room: room
        });
        start = true;
      }
  
      roomPlayers.set(room, players);
  
      if (start) {
        console.log("2 Players ready, start lobby");
        roomStatus.set(room, "Initialized");
        let ts = Date.now();
        io.to(players[0].id).emit('startDuel', players[0], players[1], ts);
        io.to(players[1].id).emit('startDuel', players[0], players[1], ts);
      }
    } else {
      //
    }

    socket.on('leaveRoomWhenWaiting', async() => {
      socket.leave(room);
      socket.removeAllListeners('updateRound');
      console.log(name + " has left room " + room);
      socket.emit('left');
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
      }
    });

    socket.on('disconnect', () => {
      socket.leave(room);
      socket.removeAllListeners('updateRound');
      console.log(name + " has left room " + room + " by disconnect");
      socket.emit('left');
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log("user disconnected");
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});