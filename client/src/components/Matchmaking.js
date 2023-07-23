import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, update, ref, get, child } from "firebase/database";

import io from "socket.io-client";
const socket = io.connect(
  "https://lockout-online-judge-production.up.railway.app/"
);

export function rankLetter(rt) {
  if (rt < 1000) return "D";
  if (1000 <= rt && rt < 1200) return "C";
  if (1200 <= rt && rt < 1400) return "B";
  if (1400 <= rt && rt < 1700) return "A-";
  if (1700 <= rt && rt < 2000) return "A";
  if (2000 <= rt && rt < 2300) return "A+";
  if (2300 <= rt && rt < 2500) return "S-";
  if (2500 <= rt && rt < 2700) return "S";
  if (2700 <= rt && rt < 3000) return "S+";
  if (3000 <= rt) return "SS";
  return "?";
}

export default function RoomList() {
  const [data, setData] = useState({});
  const currentUser = useAuth()?.currentUser;
  const [ready, setReady] = useState(false);
  const [isValid, setValid] = useState(true);
  const [started, setStarted] = useState(false);
  const [isSet, setIsSet] = useState(false);
  const [time, setTime] = useState(0);
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

    let intervalId;
    if (isSet) {
      intervalId = setInterval(() => setTime(time + 1), 1000);
      if (time % 10 == 4) {
        socket.emit("expandQueue", (time + 6) / 10);
      }
    }
    return () => clearInterval(intervalId);
  }, [isSet, time]);

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
    for (let idx = 0; idx < 5; idx += 1) {
      let ratingValue = psr[idx];
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
          problemRating: ratingValue,
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

  const moveToDuelRoom = async (p1, p2, ts, rr, dl, psr, type) => {
    try {
      setError("");

      if (type <= 2) {
        let playerDuelHistory = data.duelHistory;
        if (playerDuelHistory == undefined) playerDuelHistory = [];
        let opp = p1;
        if (type == 1) opp = p2;
        playerDuelHistory.push({
          roomCode: rr,
          opponent: opp,
          time: ts,
          duelType: "Ranked Room",
        });

        await problem_generation(p1, p2, ts, rr, dl, psr, type);

        await update(ref(getDatabase(), "users/" + currentUser.uid), {
          duelHistory: playerDuelHistory,
          currentRoom: rr,
        });
      }

      navigate("/lobby", {
        state: {
          p1: p1,
          p2: p2,
          roomID: rr,
          startTime: ts,
          endTime: ts + dl * 60000,
          isRanked: 1,
          userData: data,
        },
      });
    } catch (err) {
      setError(`${err}`);
    }
  };

  const [p1name, setP1name] = useState("");
  const [p1rating, setP1rating] = useState("");
  const [p2name, setP2name] = useState("");
  const [p2rating, setP2rating] = useState("");
  socket.on("initDuel", (p1, p2, ts, rr, dl, psr, type) => {
    setReady(true);
    setIsSet(false);
    setP1name(p1.name);
    setP1rating(p1.rating);
    setP2name(p2.name);
    setP2rating(p2.rating);
    moveToDuelRoom(p1, p2, ts, rr, dl, psr, type);
  });

  socket.on("enteredQueue", () => {
    setStarted(true);
    setIsSet(true);
  });

  socket.on("dupeQueue", () => {
    setError("You are already in matchmaking queue");
    setValid(false);
    setTimeout(() => setValid(true), 5000);
  });

  socket.on("queueOff", () => {
    setIsSet(false);
  });

  const handleEnterMatchmaking = async () => {
    if (data.codeforcesHandle == "") {
      setError("Please register your Codeforces handle");
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }
    if (data.currentRoom != "-") {
      setError("Please enter your unfinished duel with room code " + data.currentRoom);
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    // generate roomcode
    let rr = "";
    while (rr == "") {
      for (let i = 0; i < 6; i++)
        rr += characters.charAt(Math.floor(Math.random() * characters.length));
      await get(child(ref(getDatabase()), "duelRoom/" + rr))
        .then((snapshot) => {
          if (snapshot.exists()) {
            rr = "";
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // get duelLength and psetrating from database
    let currentRank = rankLetter(data.rating);
    let dl = 60;
    let psr = [800, 900, 1000, 1100, 1200];
    let psrv = [0, 0, 0, 0, 0];
    await get(child(ref(getDatabase()), "rankedDuelParameters/" + currentRank))
      .then((snapshot) => {
        if (snapshot.exists()) {
          dl = snapshot.val().duelLength;
          psr = snapshot.val().problemsetRatings;
          psrv = snapshot.val().psrVariety;
        }
      })
      .catch((error) => {
        console.error(error);
      });
    for (let i = 0; i < 5; i++) {
      let x = Math.floor(Math.random() * characters.length);
      if (psrv[i] % 2 == 1 && x % 2 == 1) psr[i] += 100;
    }

    socket.emit("joinQueue", data.codeforcesHandle, data.rating, rr, dl, psr);
  };

  const handleLeaveMatchmaking = async () => {
    setStarted(false);
    setIsSet(false);
    setTime(0);
    socket.emit("leaveQueue");
  };

  return (
    <div>
      {started ? (
        <div className="duel-container">
          {ready ? (
            <div>
              <p>Both Players are ready!</p>
              <p>
                {p1name} ({p1rating}) vs {p2name} ({p2rating})
              </p>
              {error && <Alert variant="danger">{error}</Alert>}
            </div>
          ) : (
            <div>
              <h3>Ranked Duel</h3>
              <p>{isValid ? null : error}</p>
              <p>
                {data.rating} rating ({rankLetter(data.rating)} rank)
              </p>
              <p>Searching for opponent... {time}</p>
              <button className="goButton" onClick={handleLeaveMatchmaking}>
                Leave Matchmaking
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="duel-container">
          <h3>Ranked Duel</h3>
          <p>{isValid ? null : error}</p>
          <p>
            {data.rating} rating ({rankLetter(data.rating)} rank)
          </p>
          <br />
          <button
            className="goButton"
            disable={!isValid}
            onClick={handleEnterMatchmaking}
          >
            Enter Matchmaking
          </button>
          <div className="link-button">
            <Link to="/">Cancel</Link>
          </div>
          <br />
          <h4>Rating Table</h4>
          <table>
            <tr>
              <th>Rating</th>
              <th>Rank</th>
              <th>Problem Rating Range</th>
              <th>Duration (minutes)</th>
            </tr>
            <tr>
              <td>≥ 3000</td>
              <td>SS</td>
              <td>1800 — 2600</td>
              <td>60</td>
            </tr>
            <tr>
              <td>2700 — 2999</td>
              <td>S+</td>
              <td>1700 — 2400</td>
              <td>60</td>
            </tr>
            <tr>
              <td>2500 — 2699</td>
              <td>S</td>
              <td>1500 — 2200</td>
              <td>60</td>
            </tr>
            <tr>
              <td>2300 — 2499</td>
              <td>S-</td>
              <td>1400 — 2000</td>
              <td>60</td>
            </tr>
            <tr>
              <td>2000 — 2299</td>
              <td>A+</td>
              <td>1300 — 1800</td>
              <td>60</td>
            </tr>
            <tr>
              <td>1700 — 1999</td>
              <td>A</td>
              <td>1000 — 1600</td>
              <td>60</td>
            </tr>
            <tr>
              <td>1400 — 1699</td>
              <td>A-</td>
              <td>900 — 1400</td>
              <td>60</td>
            </tr>
            <tr>
              <td>1200 — 1399</td>
              <td>B</td>
              <td>800 — 1200</td>
              <td>60</td>
            </tr>
            <tr>
              <td>1000 — 1199</td>
              <td>C</td>
              <td>800 — 1200</td>
              <td>90</td>
            </tr>
            <tr>
              <td>≤ 999</td>
              <td>D</td>
              <td>800 — 1200</td>
              <td>120</td>
            </tr>
          </table>
        </div>
      )}
    </div>
  );
}
