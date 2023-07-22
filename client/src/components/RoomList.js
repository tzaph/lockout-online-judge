import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, update, ref, get, child } from "firebase/database";

import io from "socket.io-client";
const socket = io.connect("https://lockout-online-judge-production.up.railway.app/");

export default function RoomList() {
  const [data, setData] = useState({});
  const { currentUser } = useAuth();
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const Getdata = () => {
    get(child(ref(getDatabase()), "users/" + currentUser.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };
  useEffect(() => {
    Getdata();
  }, []);

  const [room, setRoom] = useState("");
  const [isValid, setValid] = useState(true);
  const [started, setStarted] = useState(false);

  socket.on("roomFull", () => {
    setError("Room is full");
    setRoom("");
    setValid(false);
    setTimeout(() => setValid(true), 5000);
  });

  socket.on("roomUnavailable", () => {
    setError("Room code is invalid");
    setRoom("");
    setValid(false);
    setTimeout(() => setValid(true), 5000);
  });

  socket.on("dupeRoom", () => {
    setError("You have joined this room");
    setRoom("");
    setValid(false);
    setTimeout(() => setValid(true), 5000);
  });

  socket.on("joinedRoom", () => {
    setStarted(true);
  });

  function handleRoom(e) {
    setRoom(e.target.value);
  }

  const handleCreateRoom = async () => {
    if (data.codeforcesHandle == "") {
      setError("Please register your Codeforces handle");
      setRoom("");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    let newRoomCode = "";
    while (newRoomCode == "") {
      for (let i = 0; i < 6; i++)
        newRoomCode += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      await get(child(ref(getDatabase()), "duelRoom/" + newRoomCode))
        .then((snapshot) => {
          if (snapshot.exists()) {
            newRoomCode = "";
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    setRoom(newRoomCode);
    socket.emit("joinRoom", data.codeforcesHandle, newRoomCode, 1);
  };

  const handleJoinRoom = async () => {
    if (!room) {
      setError("Please enter room code");
      setRoom("");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }
    if (data.codeforcesHandle == "") {
      setError("Please register your Codeforces handle");
      setRoom("");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    // check if room was created before
    await get(child(ref(getDatabase()), "duelRoom/" + room))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setError("");
          navigate("/lobby", {
            state: {
              p1: snapshot.val().players[0],
              p2: snapshot.val().players[1],
              roomID: room,
              startTime: snapshot.val().startTime,
            },
          });
        } else {
          setRoom(room);
          socket.emit("joinRoom", data.codeforcesHandle, room, 2);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const problem_generation = async (p1, p2, ts, rr, tp) => {
    let room = rr;
    let opp = p1;
    if (tp == 1) {
      room = (rr + "_unused");
      opp = p2;
    }
    const db = getDatabase();
    const newProblems = [];
    const problemLinks = [];
    const players = [];
    const emptyarr = [];
    const startRating = 800;
    const contestLength = 1800000;
    players.push(p1);
    players.push(p2);
    for (
      let ratingValue = startRating;
      ratingValue < startRating + 500;
      ratingValue += 100
    ) {
      emptyarr.push(2000000000);
      await get(child(ref(db), "problems/" + ratingValue)).then((snapshot) => {
        newProblems.push(
          snapshot.val().problemsetList[
            Math.floor(Math.random() * snapshot.val().problemsetList.length)
          ]
        );
        let linkUrl =
          "https://codeforces.com/contest/" +
          newProblems[(ratingValue - startRating) / 100].contestId +
          "/problem/" +
          newProblems[(ratingValue - startRating) / 100].index;
        let problemName =
          newProblems[(ratingValue - startRating) / 100].contestId +
          newProblems[(ratingValue - startRating) / 100].index +
          " - " +
          newProblems[(ratingValue - startRating) / 100].name;
        let points = ratingValue - startRating + 100;
        problemLinks.push({
          contestId: newProblems[(ratingValue - startRating) / 100].contestId,
          problemIndex: newProblems[(ratingValue - startRating) / 100].index,
          problemLink: linkUrl,
          points: points,
          solved: "Unsolved",
          problemName: problemName,
          problemNumber: (ratingValue - startRating) / 100,
        });
      });
    }
    await update(ref(db, "duelRoom/" + room), {
      players: players,
      problems: newProblems,
      problemLinks: problemLinks,
      player1SubmissionId: emptyarr,
      player2SubmissionId: emptyarr,
      player1points: 0,
      player2points: 0,
      startTime: ts,
      endTime: ts + contestLength,
      resultMessage: "",
      ended: false,
    });
  };

  const moveToDuelRoom = async (p1, p2, ts, rr, type) => {
    try {
      setError("");
      await problem_generation(p1, p2, ts, rr, type);
      navigate("/lobby", {
        state: {
          p1: p1,
          p2: p2,
          roomID: rr,
          startTime: ts,
        },
      });
    } catch (err) {
      setError(`${err}`);
    }
  };

  socket.on("startDuel", (p1, p2, ts, rr, type) => {
    setReady(true);
    moveToDuelRoom(p1, p2, ts, rr, type);
  });

  function handleLeave(e) {
    setStarted(false);
    setRoom("");
    socket.emit("leaveRoomWhenWaiting");
  }

  return (
    <div>
      {started ? (
        <div className="auth-form-container">
          {ready ? (
            <div>
              <p>Both Players are ready!</p>
              {error && <Alert variant="danger">{error}</Alert>}
            </div>
          ) : (
            <div>
              <p>You are in room {room}, waiting for opponent!</p>
              <button onClick={handleLeave}>Back</button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-form-container">
          <h3>Enter room code to host/join</h3>
          <p>{isValid ? null : error}</p>
          <input
            required
            name="code"
            type="text"
            value={room}
            onChange={handleRoom}
            maxLength={10}
          ></input>
          <br />
          <button className="goButton" onClick={handleJoinRoom}>
            Join Room
          </button>
          <br />
          <button className="goButton" onClick={handleCreateRoom}>
            Create New Room
          </button>
          <div className="link-button">
            <Link to="/">Cancel</Link>
          </div>
        </div>
      )}
    </div>
  );
}
