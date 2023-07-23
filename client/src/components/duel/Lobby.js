import { getDatabase, update, get, child, ref } from "firebase/database";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export default function Lobby() {
  const propState = useLocation();
  const [timer, setTimer] = useState("00:00:00");
  const p1data = propState.state?.p1;
  const p2data = propState.state?.p2;
  const roomID = propState.state?.roomID;
  const startTime = propState.state?.startTime;
  const endTime = propState.state?.endTime;
  const isRanked = propState.state?.isRanked;
  const userData = propState.state?.userData;
  const [typeOfRoom, setTypeOfRoom] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [ratingUpdateMessage, setRatingUpdateMessage] = useState("");
  const [endedTmp, setEndedTmp] = useState(false);
  const [ended, setEnded] = useState(false);
  const [p1handle, setP1handle] = useState("");
  const [p2handle, setP2handle] = useState("");
  const [p1rating, setP1rating] = useState("");
  const [p2rating, setP2rating] = useState("");
  const [p1points, setP1points] = useState(0);
  const [p2points, setP2points] = useState(0);
  const [p1sub, setP1sub] = useState([
    2000000000, 2000000000, 2000000000, 2000000000, 2000000000,
  ]);
  const [p2sub, setP2sub] = useState([
    2000000000, 2000000000, 2000000000, 2000000000, 2000000000,
  ]);
  const [problems, setProblems] = useState([
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
      problemRating: ""
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
      problemRating: ""
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
      problemRating: ""
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
      problemRating: ""
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
      problemRating: ""
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [p1submissions, setP1submissions] = useState([]);
  const [p2submissions, setP2submissions] = useState([]);
  const Ref = useRef(null);

  function getKFactor(rt) {
    if (rt < 1000) return 40;
    if (1000 <= rt && rt < 1200) return 35;
    if (1200 <= rt && rt < 1400) return 30;
    if (1400 <= rt && rt < 1700) return 25;
    if (1700 <= rt && rt < 2000) return 20;
    if (2000 <= rt && rt < 2300) return 15;
    if (2300 <= rt && rt < 2500) return 12;
    if (2500 <= rt && rt < 2700) return 9;
    if (2700 <= rt && rt < 3000) return 7;
    return 5;
  }

  const renderProblems = async (p1, p2) => {
    const db = getDatabase();
    setLoading(true);
    setP1handle(p1.name);
    setP2handle(p2.name);
    setP1rating(p1.rating);
    setP2rating(p2.rating);
    let hasEnded = false;
    let p1p = 0;
    let p2p = 0;

    if (isRanked)
      setTypeOfRoom("Ranked");
    else
      setTypeOfRoom("Custom");
    await get(child(ref(db), "duelRoom/" + roomID))
      .then((snapshot) => {
        if (snapshot.exists()) {
          if (snapshot.val().problemLinks[0].contestId != "") {
            setP1handle(p1.name);
            setP2handle(p2.name);
            setProblems(snapshot.val().problemLinks);
            setP1sub(snapshot.val().player1SubmissionId);
            setP2sub(snapshot.val().player2SubmissionId);
            setP1points(snapshot.val().player1points);
            setP2points(snapshot.val().player2points);
            setResultMessage(snapshot.val().resultMessage);
            p1p = snapshot.val().player1points;
            p2p = snapshot.val().player2points;

            if (
              Date.now() > snapshot.val().endTime ||
              snapshot.val().player1points > 750 ||
              snapshot.val().player2points > 750
            ) {
              console.log("hi");
              setEnded(true);
              hasEnded = true;
              update(ref(db, "duelRoom/" + roomID), {
                ended: true,
              });
            } else {
              setEnded(snapshot.val().ended);
            }
          } else throw "No problems generated";
        } else {
          throw "No problems generated";
        }
      })
      .catch((error) => {
        console.error(error);
      });

    if (hasEnded) {
      if (isRanked) {
        let maxrat = p1data.rating;
        let diff = p1data.rating - p2data.rating;
        let score = 0.5;
        if (p1p > p2p) score = 1;
        if (p1p < p2p) score = 0;
        if (p1data.rating < p2data.rating) {
          maxrat = p2data.rating;
          diff = p2data.rating - p1data.rating;
          score = 0.5;
          if (p2p > p1p) score = 1;
          if (p2p < p1p) score = 0;
        }
        let expected = 1.0 / (Math.pow(10, diff / 400.0) + 1);
        score = score - expected;
        score = score * getKFactor(maxrat);
        score = Math.round((score + Number.EPSILON) * 100) / 100; // round 2 decimal places

        let p1newrating = p1data.rating + score;
        let p2newrating = p2data.rating - score;
        if (p1data.rating < p2data.rating) {
          p1newrating = p1data.rating - score;
          p2newrating = p2data.rating + score;
        }

        let msg = p1data.name + " " + p1data.rating + " → " + p1newrating + "  |  " + p2data.name + " " + p2data.rating + " → " + p2newrating;
        setRatingUpdateMessage(msg);

        if (userData.currentRoom == roomID) {
          console.log("PLEASE");
          if (userData.codeforcesHandle == p1data.name) {
            console.log("PLAYER 1?");
            await update(ref(getDatabase(), "users/" + userData.uid), {
              currentRoom: "-",
              rating: p1newrating,
            });
          }
          if (userData.codeforcesHandle == p2data.name) {
            console.log("PLAYER 2?");
            await update(ref(getDatabase(), "users/" + userData.uid), {
              currentRoom: "-",
              rating: p2newrating,
            });
          }
        }
      }
    }
    setLoading(false);
  };

  const getTimeRemaining = () => {
    const total = endTime - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    return {
      total,
      hours,
      minutes,
      seconds,
    };
  };
  const displayTimer = () => {
    let { total, hours, minutes, seconds } = getTimeRemaining();
    if (total >= 0) {
      setTimer(
        (hours > 9 ? hours : "0" + hours) +
          ":" +
          (minutes > 9 ? minutes : "0" + minutes) +
          ":" +
          (seconds > 9 ? seconds : "0" + seconds)
      );
    }
  };
  const renderTimer = () => {
    if (Ref.current) clearInterval(Ref.current);
    const id = setInterval(() => {
      displayTimer();
    }, 1000);
    Ref.current = id;
  };

  function listRecentSubmissions(codeforcesHandle) {
    return axios
      .get(
        `https://codeforces.com/api/user.status?handle=${codeforcesHandle}&from=1`
      )
      .then((res) => {
        if (p1handle == codeforcesHandle) setP1submissions(res.data.result);
        else setP2submissions(res.data.result);
      });
  }

  const refreshPage = async () => {
    const db = getDatabase();
    if (ended) {
      return;
    }

    setLoading(true);
    if (problems[0].contestId == "") {
      await renderProblems(p1data, p2data);
      return;
    }

    // check submissions
    await listRecentSubmissions(p1handle);
    await listRecentSubmissions(p2handle);
    p1submissions.map((sub) => {
      problems.map((prob) => {
        if (
          prob.contestId == sub.problem.contestId &&
          prob.problemIndex == sub.problem.index &&
          sub.verdict == "OK" &&
          sub.creationTimeSeconds * 1000 <= endTime &&
          sub.creationTimeSeconds * 1000 >= startTime
        ) {
          p1sub[prob.problemNumber] = Math.min(
            p1sub[prob.problemNumber],
            sub.id
          );
        }
      });
    });
    p2submissions.map((sub) => {
      problems.map((prob) => {
        if (
          prob.contestId == sub.problem.contestId &&
          prob.problemIndex == sub.problem.index &&
          sub.verdict == "OK" &&
          sub.creationTimeSeconds * 1000 <= endTime &&
          sub.creationTimeSeconds * 1000 >= startTime
        ) {
          p2sub[prob.problemNumber] = Math.min(
            p2sub[prob.problemNumber],
            sub.id
          );
        }
      });
    });
    let p1newpoints = 0;
    let p2newpoints = 0;
    const newSolvedStatus = [];
    for (let i = 0; i < 5; i++) {
      if (p1sub[i] < p2sub[i]) {
        p1newpoints = p1newpoints + problems[i].points;
        newSolvedStatus.push(p1handle);
      } else if (p1sub[i] > p2sub[i]) {
        p2newpoints = p2newpoints + problems[i].points;
        newSolvedStatus.push(p2handle);
      } else {
        newSolvedStatus.push("Unsolved");
      }
    }

    const newProblemLink = [];
    for (let i = 0; i < 5; i++) {
      newProblemLink.push({
        contestId: problems[i].contestId,
        problemIndex: problems[i].problemIndex,
        problemLink: problems[i].problemLink,
        points: problems[i].points,
        solved: newSolvedStatus[i],
        problemName: problems[i].problemName,
        problemNumber: problems[i].problemNumber,
        problemRating: problems[i].problemRating,
      });
    }
    setProblems(newProblemLink);
    setP1points(p1newpoints);
    setP2points(p2newpoints);

    let currentTime = Date.now();
    let rmsg = "";
    if (currentTime >= endTime || p1newpoints > 750 || p2newpoints > 750) {
      if (p1newpoints == p2newpoints) {
        rmsg = "Contest ended with a draw!";
      } else if (p1newpoints > p2newpoints) {
        rmsg = "Contest ended, " + p1handle + " wins!";
      } else if (p1newpoints < p2newpoints) {
        rmsg = "Contest ended, " + p2handle + " wins!";
      }
      setResultMessage(rmsg);
      if (endedTmp) {
        setEnded(true);

        if (isRanked) {
          let maxrat = p1data.rating;
          let diff = p1data.rating - p2data.rating;
          let score = 0.5;
          if (p1newpoints > p2newpoints) score = 1;
          if (p1newpoints < p2newpoints) score = 0;
          if (p1data.rating < p2data.rating) {
            maxrat = p2data.rating;
            diff = p2data.rating - p1data.rating;
            score = 0.5;
            if (p2newpoints > p1newpoints) score = 1;
            if (p2newpoints < p1newpoints) score = 0;
          }
          let expected = 1.0 / (Math.pow(10, diff / 400.0) + 1);
          score = score - expected;
          score = score * getKFactor(maxrat);
          score = Math.round((score + Number.EPSILON) * 100) / 100; // round 2 decimal places

          let p1newrating = p1data.rating + score;
          let p2newrating = p2data.rating - score;
          if (p1data.rating < p2data.rating) {
            p1newrating = p1data.rating - score;
            p2newrating = p2data.rating + score;
          }

          let msg = p1data.name + " " + p1data.rating + " → " + p1newrating + "  |  " + p2data.name + " " + p2data.rating + " → " + p2newrating;
          setRatingUpdateMessage(msg);

          if (userData.currentRoom == roomID) {
            if (userData.codeforcesHandle == p1data.name) {
              console.log(userData.uid);
              await update(ref(getDatabase(), "users/" + userData.uid), {
                currentRoom: "-",
                rating: p1newrating,
              });
            }
            if (userData.codeforcesHandle == p2data.name) {
              await update(ref(getDatabase(), "users/" + userData.uid), {
                currentRoom: "-",
                rating: p2newrating,
              });
            }
          }
        }

        await update(ref(db, "duelRoom/" + roomID), {
          resultMessage: rmsg,
          ended: true,
        });
      } else {
        setEndedTmp(true);
      }
    }

    await update(ref(db, "duelRoom/" + roomID), {
      problemLinks: newProblemLink,
      player1SubmissionId: p1sub,
      player2SubmissionId: p2sub,
      player1points: p1newpoints,
      player2points: p2newpoints,
      resultMessage: rmsg,
    });

    setLoading(false);
  };

  useEffect(() => {
    console.log(endTime);
    console.log(isRanked);
    console.log(userData);
    renderProblems(p1data, p2data);
    renderTimer();
    if (ended) {
      return;
    }
  }, []);

  return (
    <div className="duel-container">
      <h3>
        {typeOfRoom} Room {roomID}: {p1handle} ({p1rating}) vs {p2handle} ({p2rating})
      </h3>
      <h4>
        {p1points} - {p2points}
      </h4>
      <p>{ended ? resultMessage : timer}</p>
      <p>{ended ? ratingUpdateMessage : null}</p>
      <table>
        <tr>
          <th>Problems</th>
          <th>Points</th>
          <th>Rating</th>
          <th>Status</th>
        </tr>
        {problems.map((val) => {
          return (
            <tr>
              <td>
                <a href={val.problemLink} target="_blank">
                  {val.problemName}
                </a>
              </td>
              <td>{val.points}</td>
              <td>{val.problemRating}</td>
              <td>{val.solved}</td>
            </tr>
          );
        })}
      </table>
      {ended ? null : (
        <button disabled={loading} onClick={refreshPage}>
          Refresh
        </button>
      )}
      <div className="link-button">
        <Link to="/">Leave</Link>
      </div>
    </div>
  );
}
