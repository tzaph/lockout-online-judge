const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const port = process.env.PORT || 5500;

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://lockout-online-judge.netlify.app",
    methods: ["GET", "POST"],
  },
});

const roomPlayers = new Map();
const roomStatus = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.emit("connection");

  socket.on("joinRoom", async (name, room, type) => {
    console.log(`${name} ${room} ${type}`);
    if (!roomPlayers.has(room) && type == 2) {
      console.log(
        `${name}'s request to join room ${room} rejected (ROOM UNAVAILABLE)`
      );
      socket.emit("roomUnavailable");
    } else {
      if (!roomPlayers.has(room)) {
        const emptyArray = [];
        roomPlayers.set(room, emptyArray);
        roomStatus.set(room, "Waiting");
      }

      let start = false;

      const temp = await io.in(room).fetchSockets();
      const playerCount = temp.length;
      players = roomPlayers.get(room);
      duelStatus = roomStatus.get(room);

      console.log(
        name +
          " sent request to join " +
          room +
          " with room status " +
          duelStatus
      );

      if (duelStatus == "Initialized") {
        socket.emit("startDuel", players[0], players[1]);
      } else if (duelStatus == "Waiting") {
        if (playerCount > 1) {
          console.log(
            `${name}'s request to join room ${room} rejected (ROOM FULL)`
          );
          socket.emit("roomFull");
          return;
        } else if (playerCount == 0) {
          console.log(
            `${name}'s request to join room ${room} accepted (FIRST PLAYER)`
          );
          socket.join(room);
          socket.emit("joinedRoom");

          players.push({
            id: socket.id,
            name: name,
            room: room,
          });
        } else {
          if (players[0].name == name) {
            console.log(
              `${name}'s request to join room ${room} rejected (ALREADY IN ROOM)`
            );
            socket.emit("dupeRoom");
            return;
          } else {
            console.log(
              `${name}'s request to join room ${room} accepted (SECOND PLAYER)`
            );
            socket.join(room);
            socket.emit("joinedRoom");
  
            players.push({
              id: socket.id,
              name: name,
              room: room,
            });
            start = true;
          }
        }

        roomPlayers.set(room, players);

        if (start) {
          console.log("2 Players ready, start lobby");
          roomStatus.set(room, "Initialized");
          let ts = Date.now();
          io.to(players[0].id).emit(
            "startDuel",
            players[0],
            players[1],
            ts,
            room,
            1
          );
          io.to(players[1].id).emit(
            "startDuel",
            players[0],
            players[1],
            ts,
            room,
            2
          );
        }
      } else {
        //
      }
    }

    socket.on("leaveRoomWhenWaiting", async () => {
      socket.leave(room);
      socket.removeAllListeners("updateRound");
      console.log(name + " has left room " + room);
      socket.emit("left");
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
      }
    });

    socket.on("disconnect", () => {
      socket.leave(room);
      socket.removeAllListeners("updateRound");
      console.log(name + " has left room " + room + " by disconnect");
      socket.emit("left");
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log("SERVER IS RUNNING");
});
