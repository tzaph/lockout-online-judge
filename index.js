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

const customQueueStatus = [];
const rankedQueueStatus = [];

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.emit("connection");

  socket.on("joinRoom", async (name, rating, room, duelLength, problemsetRating, type) => {
    console.log(`Join Room ${name} ${rating} ${room} ${duelLength} ${type}`);

    customQueueLen = customQueueStatus.length;
    rankedQueueLen = rankedQueueStatus.length;

    // check for dupes
    let dupe = 0;
    for (let i = 0; i < rankedQueueLen; i++) {
      let player = rankedQueueStatus[i];
      if (player.name == name) {
        dupe = 1;
      }
    }
    for (let i = 0; i < customQueueLen; i++) {
      let player = customQueueStatus[i];
      if (player.name == name) {
        dupe = 1;
      }
    }

    if (dupe == 1) {
      console.log("Request rejected, " + name + " is already inside the queue (ranked/custom)");
      socket.emit("dupeQueue");
    } else {
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
            customQueueStatus.push({
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
              customQueueStatus.push({
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

            for (let i = 0; i < 2; i++) {
              let id = -1;
              for (let i = 0; i < customQueueStatus.length; i++)
                if (customQueueStatus[i].name == players[i].name)
                  id = i;
              if (id != -1) {
                let tmpQueueStatus = [];
                for (let i = 0; i < customQueueStatus.length; i++)
                  if (i != id)
                    tmpQueueStatus.push(customQueueStatus[i]);
                    let ql = customQueueStatus.length;
                for (let i = 0; i < ql; i++) customQueueStatus.pop();
                for (let i = 0; i < tmpQueueStatus.length; i++) customQueueStatus.push(tmpQueueStatus[i]);
              }
            }

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
    }

    socket.on("leaveRoomWhenWaiting", async () => {
      socket.leave(room);
      socket.removeAllListeners("updateRound");
      console.log(name + " has left room " + room);

      let id = -1;
      for (let i = 0; i < customQueueStatus.length; i++)
        if (customQueueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < customQueueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(customQueueStatus[i]);
            let ql = customQueueStatus.length;
        for (let i = 0; i < ql; i++) customQueueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) customQueueStatus.push(tmpQueueStatus[i]);
      }

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

      let id = -1;
      for (let i = 0; i < customQueueStatus.length; i++)
        if (customQueueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < customQueueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(customQueueStatus[i]);
            let ql = customQueueStatus.length;
        for (let i = 0; i < ql; i++) customQueueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) customQueueStatus.push(tmpQueueStatus[i]);
      }

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
    customQueueLen = customQueueStatus.length;
    rankedQueueLen = rankedQueueStatus.length;

    // check for dupes
    let dupe = 0;
    for (let i = 0; i < rankedQueueLen; i++) {
      let player = rankedQueueStatus[i];
      if (player.name == name) {
        dupe = 1;
      }
    }
    for (let i = 0; i < customQueueLen; i++) {
      let player = customQueueStatus[i];
      if (player.name == name) {
        dupe = 1;
      }
    }

    if (dupe == 1) {
      console.log("Request rejected, " + name + " is already inside the queue (ranked/custom)");
      socket.emit("dupeQueue");
    } else {
      rankedQueueStatus.push({
        socketId: socket.id,
        name: name,
        rating: rating,
        spanLevel: 0,
        room: room,
        duelLength: duelLength,
        problemsetRating: problemsetRating
      });
  
      socket.emit("enteredQueue");
    }
  
    socket.on("expandQueue", (spanLevel) => {
      console.log(name + " expands search level to " + spanLevel);
      let idx = -1;
      if (spanLevel > 10) spanLevel = 10; // normalizing
      rankedQueueLen = rankedQueueStatus.length;
      for (let i = 0; i < rankedQueueLen; i++) {
        let player = rankedQueueStatus[i];
        if (player.name == name) {
          idx = i;
          if (rankedQueueStatus[idx].spanLevel < spanLevel)
          rankedQueueStatus[idx].spanLevel = spanLevel;
        }
      }

      if (idx == -1) {
        console.log("Request rejected, " + name + " not found inside the queue");
        socket.emit("queueOff");
        return;
      }

      socket.emit("enteredQueue");

      rankedQueueLen = rankedQueueStatus.length;
      let ratingL1 = rankedQueueStatus[idx].rating - (rankedQueueStatus[idx].spanLevel + 1) * 10;
      let ratingR1 = rankedQueueStatus[idx].rating + (rankedQueueStatus[idx].spanLevel + 1) * 10;
      // check for compatibility between current player and others
      let otheridx = -1;
      for (let i = 0; i < rankedQueueLen; i++) if (i != idx) {
        let ratingL2 = rankedQueueStatus[i].rating - (rankedQueueStatus[i].spanLevel + 1) * 10;
        let ratingR2 = rankedQueueStatus[i].rating + (rankedQueueStatus[i].spanLevel + 1) * 10;
        if (ratingL1 <= rankedQueueStatus[i].rating && rankedQueueStatus[i].rating <= ratingR1 &&
          ratingL2 <= rankedQueueStatus[idx].rating && rankedQueueStatus[idx].rating <= ratingR2) {
            // match up
            console.log("match up " + rankedQueueStatus[idx].name + " vs " + rankedQueueStatus[i].name);
            let ts = Date.now();
            let j = idx;
            if (rankedQueueStatus[idx].rating < rankedQueueStatus[i].rating) j = i;
            io.to(rankedQueueStatus[idx].socketId).emit(
              "initDuel",
              rankedQueueStatus[idx],
              rankedQueueStatus[i],
              ts,
              rankedQueueStatus[j].room,
              rankedQueueStatus[j].duelLength,
              rankedQueueStatus[j].problemsetRating,
              1
            );
            io.to(rankedQueueStatus[i].socketId).emit(
              "initDuel",
              rankedQueueStatus[idx],
              rankedQueueStatus[i],
              ts,
              rankedQueueStatus[j].room,
              rankedQueueStatus[j].duelLength,
              rankedQueueStatus[j].problemsetRating,
              2
            );

            const tmparr = [];
            tmparr.push({
              id: rankedQueueStatus[idx].socketId,
              name: rankedQueueStatus[idx].name,
              room: rankedQueueStatus[j].room,
              rating: rankedQueueStatus[idx].rating
            });
            tmparr.push({
              id: rankedQueueStatus[i].socketId,
              name: rankedQueueStatus[i].name,
              room: rankedQueueStatus[j].room,
              rating: rankedQueueStatus[i].rating
            });
            roomDuelLength.set(rankedQueueStatus[j].room, rankedQueueStatus[j].duelLength);
            roomPlayers.set(rankedQueueStatus[j].room, tmparr);
            roomStartTime.set(rankedQueueStatus[j].room, ts);
            roomProblemsetRating.set(rankedQueueStatus[j].room, rankedQueueStatus[j].problemsetRating);
            roomStatus.set(rankedQueueStatus[j].room, "Initialized");
            roomIsRanked.set(rankedQueueStatus[j].room, 1);
            otheridx = i;
          }
      }

      if (otheridx != -1) {
        // delete idx and otheridx
        let tmpQueueStatus = [];
        for (let i = 0; i < rankedQueueStatus.length; i++)
          if (i != idx && i != otheridx)
            tmpQueueStatus.push(rankedQueueStatus[i]);
        let ql = rankedQueueStatus.length;
        for (let i = 0; i < ql; i++) rankedQueueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) rankedQueueStatus.push(tmpQueueStatus[i]);
      }
    });

    socket.on("leaveQueue", () => {
      console.log(name + " has left queue");
      let id = -1;
      for (let i = 0; i < rankedQueueStatus.length; i++)
        if (rankedQueueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < rankedQueueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(rankedQueueStatus[i]);
            let ql = rankedQueueStatus.length;
        for (let i = 0; i < ql; i++) rankedQueueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) rankedQueueStatus.push(tmpQueueStatus[i]);
      }
    });

    socket.on("disconnect", () => {
      console.log(name + " has left queue by disconnect");
      let id = -1;
      for (let i = 0; i < rankedQueueStatus.length; i++)
        if (rankedQueueStatus[i].name == name)
          id = i;
      if (id != -1) {
        let tmpQueueStatus = [];
        for (let i = 0; i < rankedQueueStatus.length; i++)
          if (i != id)
            tmpQueueStatus.push(rankedQueueStatus[i]);
            let ql = rankedQueueStatus.length;
        for (let i = 0; i < ql; i++) rankedQueueStatus.pop();
        for (let i = 0; i < tmpQueueStatus.length; i++) rankedQueueStatus.push(tmpQueueStatus[i]);
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
