import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, update, ref, get, child } from "firebase/database";

import io from "socket.io-client";
const socket = io.connect("https://lockout-online-judge-production.up.railway.app/");

export default function RoomList() {
  const [data, setData] = useState({});
  const currentUser = useAuth()?.currentUser;
  const [ready, setReady] = useState(false);
  const [isSet, setIsSet] = useState(false);
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

  const [duelLengthTime, setDuelLengthTime] = useState(60);
  function handleDuelLength(e) {
    setDuelLengthTime(e.target.value);
  }
  const [problemRating1, setProblemRating1] = useState(800);
  const [problemRating2, setProblemRating2] = useState(900);
  const [problemRating3, setProblemRating3] = useState(1000);
  const [problemRating4, setProblemRating4] = useState(1100);
  const [problemRating5, setProblemRating5] = useState(1200);
  function handleProblemRating1(e) {
    setProblemRating1(e.target.value);
  }
  function handleProblemRating2(e) {
    setProblemRating2(e.target.value);
  }
  function handleProblemRating3(e) {
    setProblemRating3(e.target.value);
  }
  function handleProblemRating4(e) {
    setProblemRating4(e.target.value);
  }
  function handleProblemRating5(e) {
    setProblemRating5(e.target.value);
  }

  const handleCreateRoom = async() => {
    if (data.codeforcesHandle == "") {
      setError("Please register your Codeforces handle");
      setRoom("");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    setStarted(true);
  }

  function invalidProblemRating(x) {
    if (800 <= x && x <= 3500 && x % 100 == 0) return false;
    return true;
  }

  const handleReadyRoom = async () => {
    if (duelLengthTime < 5) {
      setError("Duel must be at least 5 minutes long");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }
    if (duelLengthTime > 1440) {
      setError("Duel must be at most 1440 minutes long");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }
    if (invalidProblemRating(problemRating1) || invalidProblemRating(problemRating2)
      || invalidProblemRating(problemRating3) || invalidProblemRating(problemRating4)
      || invalidProblemRating(problemRating5)) {
      setError("Problem ratings must be between 800 and 3500 inclusive and divisible by 100");
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

    let problemsetRating = [problemRating1, problemRating2, problemRating3, problemRating4, problemRating5];
    setIsSet(true);
    setRoom(newRoomCode);
    socket.emit("joinRoom", data.codeforcesHandle, data.rating, newRoomCode, duelLengthTime, problemsetRating, 1);
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
    if (data.currentRoom != "-" && data.currentRoom != room) {
      setError("Please enter your unfinished duel with room code " + data.currentRoom);
      setRoom("");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    // check if room was created before
    await get(child(ref(getDatabase()), "duelRoom/" + room))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setRoom(room);
          let defaultArray = [800, 900, 1000, 1100, 1200];
          socket.emit("joinRoom", data.codeforcesHandle, data.rating, room, 60, defaultArray, 3);
        } else {
          setRoom(room);
          let defaultArray = [800, 900, 1000, 1100, 1200];
          socket.emit("joinRoom", data.codeforcesHandle, data.rating, room, 60, defaultArray, 2);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const problem_generation = async (p1, p2, ts, rr, dl, psr, tp) => {
    let room = rr;
    if (tp == 1) {
      room = rr + "_unused";
    }

    const db = getDatabase();
    const newProblems = [];
    const problemLinks = [];
    const players = [];
    const emptyarr = [];
    const contestLength = 60000 * dl;
    players.push(p1);
    players.push(p2);
    console.log("time " + dl);
    for (let idx = 0; idx < 5; idx += 1) {
      let ratingValue = psr[idx];
      console.log(ratingValue);
      emptyarr.push(2000000000);
      await get(child(ref(db), "problems/" + ratingValue)).then((snapshot) => {
        newProblems.push(
          snapshot.val().problemsetList[
            Math.floor(Math.random() * snapshot.val().problemsetList.length)
          ]
        );
        let linkUrl =
          "https://codeforces.com/contest/" +
          newProblems[idx].contestId +
          "/problem/" +
          newProblems[idx].index;
        let problemName =
          newProblems[idx].contestId +
          newProblems[idx].index +
          " - " +
          newProblems[idx].name;
        let points = (idx + 1) * 100;
        problemLinks.push({
          contestId: newProblems[idx].contestId,
          problemIndex: newProblems[idx].index,
          problemLink: linkUrl,
          points: points,
          solved: "Unsolved",
          problemName: problemName,
          problemNumber: idx,
          problemRating: ratingValue
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

  const moveToDuelRoom = async (p1, p2, ts, rr, dl, psr, type, isRanked) => {
    try {
      console.log(type);
      setError("");

      if (type <= 2) {
        let playerDuelHistory = data.duelHistory;
        console.log(data.duelHistory);
        if (playerDuelHistory == undefined) playerDuelHistory = [];
        let opp = p1;
        if (type == 1) opp = p2;
        playerDuelHistory.push({
          roomCode: rr,
          opponent: opp,
          time: ts,
          duelType: "Custom Room"
        });
      
        await problem_generation(p1, p2, ts, rr, dl, psr, type);

        await update(ref(getDatabase(), "users/" + currentUser.uid), {
          duelHistory: playerDuelHistory,
          currentRoom: rr
        });
      }

      navigate("/lobby", {
        state: {
          p1: p1,
          p2: p2,
          roomID: rr,
          startTime: ts,
          endTime: (ts + dl * 60000),
          isRanked: isRanked,
          userData: data
        },
      });
    } catch (err) {
      setError(`${err}`);
    }
  };

  socket.on("startDuel", (p1, p2, ts, rr, dl, psr, type, isRanked) => {
    setReady(true);
    console.log(ts);
    console.log(dl);
    console.log(type);
    moveToDuelRoom(p1, p2, ts, rr, dl, psr, type, isRanked);
  });

  function handleLeave(e) {
    setStarted(false);
    setIsSet(false);
    setRoom("");
    socket.emit("leaveRoomWhenWaiting");
  }

  return (
    <div>
      {started ? (
        <div className="duel-container">
          {ready ? (
            <div>
              <p>Both Players are ready!</p>
              {error && <Alert variant="danger">{error}</Alert>}
            </div>
          ) : ( 
            isSet ? (
              <div>
                <p>You are in room {room}, waiting for opponent!</p>
                <button onClick={handleLeave}>Back</button>
              </div>
            ) : (
              <div>
                <p>{isValid ? null : error}</p>
                <p>Duel Length in Minutes</p>
                <input
                  required
                  name="duelLength"
                  type="number"
                  value={duelLengthTime}
                  onChange={handleDuelLength}
                  min="5"
                  max="1440"
                  step="5"
                ></input>
                <p>100 Point Problem Rating</p>
                <input
                  required
                  name="problemRatingA"
                  type="number"
                  value={problemRating1}
                  onChange={handleProblemRating1}
                  min="800"
                  max="3500"
                  step="100"
                ></input>
                <p>200 Point Problem Rating</p>
                <input
                  required
                  name="problemRatingB"
                  type="number"
                  value={problemRating2}
                  onChange={handleProblemRating2}
                  min="800"
                  max="3500"
                  step="100"
                ></input>
                <p>300 Point Problem Rating</p>
                <input
                  required
                  name="problemRatingC"
                  type="number"
                  value={problemRating3}
                  onChange={handleProblemRating3}
                  min="800"
                  max="3500"
                  step="100"
                ></input>
                <p>400 Point Problem Rating</p>
                <input
                  required
                  name="problemRatingD"
                  type="number"
                  value={problemRating4}
                  onChange={handleProblemRating4}
                  min="800"
                  max="3500"
                  step="100"
                ></input>
                <p>500 Point Problem Rating</p>
                <input
                  required
                  name="problemRatingE"
                  type="number"
                  value={problemRating5}
                  onChange={handleProblemRating5}
                  min="800"
                  max="3500"
                  step="100"
                ></input>
                <br />
                <button className="goButton" onClick={handleReadyRoom}>
                  Create Room
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="duel-container">
          <h3>Enter room code to host/join</h3>
          <p>{isValid ? null : error}</p>
          <input
            required
            name="code"
            type="text"
            value={room}
            onChange={handleRoom}
            maxLength={6}
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
