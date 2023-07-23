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
const roomProblemsetRating = new Map();
const roomStartTime = new Map();
const roomDuelLength = new Map();
const roomIsRanked = new Map();

const queueStatus = [];

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.emit("connection");

  socket.on("joinRoom", async (name, rating, room, duelLength, problemsetRating, type) => {
    console.log(`${name} ${rating} ${room} ${duelLength} ${type}`);
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
        roomProblemsetRating.set(room, problemsetRating);
        roomDuelLength.set(room, duelLength);
        roomIsRanked.set(room, 0);
      }

      let start = false;

      const temp = await io.in(room).fetchSockets();
      const playerCount = temp.length;
      players = roomPlayers.get(room);
      duelStatus = roomStatus.get(room);
      psetRating = roomProblemsetRating.get(room);
      duelLen = roomDuelLength.get(room);

      console.log(
        name +
          " sent request to join " +
          room +
          " with room status " +
          duelStatus
      );

      if (duelStatus == "Initialized") {
        console.log(
          `${name}'s request to join room ${room} accepted (EXISTING ROOM)`
        );
        console.log(players[0]);
        socket.emit("startDuel", players[0], players[1], roomStartTime.get(room), room, duelLen, psetRating, 3, roomIsRanked.get(room));
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
            rating: rating
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
              rating: rating
            });
            start = true;
          }
        }

        roomPlayers.set(room, players);

        if (start) {
          console.log("2 Players ready, start lobby");
          roomStatus.set(room, "Initialized");
          let ts = Date.now();
          roomStartTime.set(room, ts);
          io.to(players[0].id).emit(
            "startDuel",
            players[0],
            players[1],
            ts,
            room,
            duelLen,
            psetRating,
            1,
            0
          );
          io.to(players[1].id).emit(
            "startDuel",
            players[0],
            players[1],
            ts,
            room,
            duelLen,
            psetRating,
            2,
            0
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
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
        roomProblemsetRating.delete(room);
        roomDuelLength.delete(room);
        roomStartTime.delete(room);
        roomIsRanked.delete(room);
      }
    });

    socket.on("disconnect", () => {
      socket.leave(room);
      socket.removeAllListeners("updateRound");
      console.log(name + " has left room " + room + " by disconnect");
      if (roomStatus.get(room) == "Waiting") {
        roomPlayers.delete(room);
        roomStatus.delete(room);
        roomProblemsetRating.delete(room);
        roomDuelLength.delete(room);
        roomStartTime.delete(room);
        roomIsRanked.delete(room);
      }
    });
  });

  socket.on("joinQueue", async (name, rating, room, duelLength, problemsetRating) => {
    console.log(name + " " + rating + " enters queue");
    queueLen = queueStatus.length;

    // check for dupes
    let dupe = 0;
    for (let i = 0; i < queueLen; i++) {
      let player = queueStatus[i];
      if (player.name == name) {
        dupe = 1;
      }
    }
    if (dupe == 1) {
      console.log("Request rejected, " + name + " is already inside the queue");
      socket.emit("dupeQueue");
    } else {
      queueStatus.push({
        socketId: socket.id,
        name: name,
        rating: rating,
        spanLevel: 0,
        room: room,
        duelLength: duelLength,
        problemsetRating: problemsetRating
      });
  
      console.log("queue rn:");
      for (let i = 0; i < queueStatus.length; i++)
        console.log(queueStatus[i].socketId + " " + queueStatus[i].name + " " + queueStatus[i].rating + " " + queueStatus[i].spanLevel + " " + queueStatus[i].room + " " + queueStatus[i].psr);
      socket.emit("enteredQueue");
    }
  
    socket.on("expandQueue", (spanLevel) => {
      console.log(name + " expands search level to " + spanLevel);
      let idx = -1;
      if (spanLevel > 10) spanLevel = 10; // normalizing
      queueLen = queueStatus.length;
      for (let i = 0; i < queueLen; i++) {
        let player = queueStatus[i];
        if (player.name == name) {
          idx = i;
          if (queueStatus[idx].spanLevel < spanLevel)
            queueStatus[idx].spanLevel = spanLevel;
        }
      }

      if (idx == -1) {
        console.log("Request rejected, " + name + " not found inside the queue");
        socket.emit("queueOff");
        return;
      }

      console.log("queue rn:");
      for (let i = 0; i < queueStatus.length; i++)
        console.log(queueStatus[i].socketId + " " + queueStatus[i].name + " " + queueStatus[i].rating + " " + queueStatus[i].spanLevel);
      socket.emit("enteredQueue");

      queueLen = queueStatus.length;
      let ratingL1 = queueStatus[idx].rating - (queueStatus[idx].spanLevel + 1) * 10;
      let ratingR1 = queueStatus[idx].rating + (queueStatus[idx].spanLevel + 1) * 10;
      // check for compatibility between current player and others
      let otheridx = -1;
      for (let i = 0; i < queueLen; i++) if (i != idx) {
        let ratingL2 = queueStatus[i].rating - (queueStatus[i].spanLevel + 1) * 10;
        let ratingR2 = queueStatus[i].rating + (queueStatus[i].spanLevel + 1) * 10;
        if (ratingL1 <= queueStatus[i].rating && queueStatus[i].rating <= ratingR1 &&
          ratingL2 <= queueStatus[idx].rating && queueStatus[idx].rating <= ratingR2) {
            // match up
            console.log("match up " + queueStatus[idx].name + " vs " + queueStatus[i].name);
            let ts = Date.now();
            let j = idx;
            if (queueStatus[idx].rating < queueStatus[i].rating) j = i;
            io.to(queueStatus[idx].socketId).emit(
              "initDuel",
              queueStatus[idx],
              queueStatus[i],
              ts,
              queueStatus[j].room,
              queueStatus[j].duelLength,
              queueStatus[j].problemsetRating,
              1
            );
            io.to(queueStatus[i].socketId).emit(
              "initDuel",
              queueStatus[idx],
              queueStatus[i],
              ts,
              queueStatus[j].room,
              queueStatus[j].duelLength,
              queueStatus[j].problemsetRating,
              2
            );

            const tmparr = [];
            tmparr.push({
              id: queueStatus[idx].socketId,
              name: queueStatus[idx].name,
              room: queueStatus[j].room,
              rating: queueStatus[idx].rating
            });
            tmparr.push({
              id: queueStatus[i].socketId,
              name: queueStatus[i].name,
              room: queueStatus[j].room,
              rating: queueStatus[i].rating
            });
            roomDuelLength.set(queueStatus[j].room, queueStatus[j].duelLength);
            roomPlayers.set(queueStatus[j].room, tmparr);
            roomStartTime.set(queueStatus[j].room, ts);
            roomProblemsetRating.set(queueStatus[j].room, queueStatus[j].problemsetRating);
            roomStatus.set(queueStatus[j].room, "Initialized");
            roomIsRanked.set(queueStatus[j].room, 1);
            console.log(roomIsRanked.get(room));
            otheridx = i;
          }
      }

      if (otheridx != -1) {
        // delete idx and otheridx
        let tmpQueueStatus = [];
        for (let i = 0; i < queueStatus.length; i++)
          if (i != idx && i != otheridx)
            tmpQueueStatus.push(queueStatus[i]);
        let ql = queueStatus.length;
        for (let i = 0; i < ql; i++) queueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) queueStatus.push(tmpQueueStatus[i]);
      }
    });

    socket.on("leaveQueue", () => {
      console.log(name + " has left queue");
      let id = -1;
      for (let i = 0; i < queueStatus.length; i++)
        if (queueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < queueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(queueStatus[i]);
            let ql = queueStatus.length;
        for (let i = 0; i < ql; i++) queueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) queueStatus.push(tmpQueueStatus[i]);
      }
    });

    socket.on("disconnect", () => {
      console.log(name + " has left queue by disconnect");
      let id = -1;
      for (let i = 0; i < queueStatus.length; i++)
        if (queueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < queueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(queueStatus[i]);
            let ql = queueStatus.length;
        for (let i = 0; i < ql; i++) queueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) queueStatus.push(tmpQueueStatus[i]);
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
