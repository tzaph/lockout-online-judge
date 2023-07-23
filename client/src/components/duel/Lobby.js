import { getDatabase, update, get, child, ref } from "firebase/database";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export default function Lobby() {
  const propState = useLocation();
  const contestLength = 1800000; // 1 minute = 60000, currently set to 45 minutes
  const [timer, setTimer] = useState("00:00:00");
  const p1data = propState.state?.p1;
  const p2data = propState.state?.p2;
  const roomID = propState.state?.roomID;
  const startTime = propState.state?.startTime;
  const [resultMessage, setResultMessage] = useState("");
  const [ended, setEnded] = useState(false);
  const [endTime, setEndTime] = useState(0);
  const [p1handle, setP1handle] = useState("");
  const [p2handle, setP2handle] = useState("");
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
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
    },
    {
      contestId: "",
      problemIndex: "",
      problemLink: "",
      points: "",
      solved: "",
      problemName: "",
      problemNumber: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [p1submissions, setP1submissions] = useState([]);
  const [p2submissions, setP2submissions] = useState([]);
  const Ref = useRef(null);

  const renderProblems = async (p1, p2) => {
    const db = getDatabase();
    setLoading(true);
    setEndTime(startTime + contestLength);
    setP1handle(p1.name);
    setP2handle(p2.name);

    await get(child(ref(db), "duelRoom/" + roomID))
      .then((snapshot) => {
        if (snapshot.exists()) {
          if (snapshot.val().problemLinks[0].contestId != "") {
            setP1handle(p1.name);
            setP2handle(p2.name);
            setProblems(snapshot.val().problemLinks);
            setEndTime(snapshot.val().endTime);
            setP1sub(snapshot.val().player1SubmissionId);
            setP2sub(snapshot.val().player2SubmissionId);
            setP1points(snapshot.val().player1points);
            setP2points(snapshot.val().player2points);

            if (
              Date.now() > snapshot.val().endTime ||
              snapshot.val().player1points > 750 ||
              snapshot.val().player2points > 750
            ) {
              let msg = "";
              if (
                snapshot.val().player1points == snapshot.val().player2points
              ) {
                msg = "Contest ended with a draw!";
              } else if (
                snapshot.val().player1points > snapshot.val().player2points
              ) {
                msg = "Contest ended, " + p1handle + " wins!";
              } else if (
                snapshot.val().player1points < snapshot.val().player2points
              ) {
                msg = "Contest ended, " + p2handle + " wins!";
              }
              setResultMessage(msg);
              setEnded(true);
              update(ref(db, "duelRoom/" + roomID), {
                resultMessage: msg,
                ended: true,
              });
            } else {
              setResultMessage(snapshot.val().resultMessage);
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

    setLoading(false);
  };

  const getTimeRemaining = () => {
    const total = startTime + contestLength - Date.now();
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
        `https://codeforces.com/api/user.status?handle=${codeforcesHandle}&from=1&count=100`
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
          sub.verdict == "OK"
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
          sub.verdict == "OK"
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
      });
    }
    setProblems(newProblemLink);
    setP1points(p1newpoints);
    setP2points(p2newpoints);

    let currentTime = Date.now();
    if (currentTime >= endTime || p1newpoints > 750 || p2newpoints > 750) {
      if (p1newpoints == p2newpoints) {
        setResultMessage("Contest ended with a draw!");
      } else if (p1newpoints > p2newpoints) {
        setResultMessage("Contest ended, " + p1handle + " wins!");
      } else if (p1newpoints < p2newpoints) {
        setResultMessage("Contest ended, " + p2handle + " wins!");
      }
      setEnded(true);
      await update(ref(db, "duelRoom/" + roomID), {
        ended: true,
      });
    }

    await update(ref(db, "duelRoom/" + roomID), {
      problemLinks: newProblemLink,
      player1SubmissionId: p1sub,
      player2SubmissionId: p2sub,
      player1points: p1newpoints,
      player2points: p2newpoints,
      resultMessage: resultMessage,
    });

    setLoading(false);
  };

  useEffect(() => {
    renderProblems(p1data, p2data);
    renderTimer();
    if (ended) {
      return;
    }
  }, []);

  return (
    <div className="auth-form-container">
      <h3>
        Room {roomID}: {p1handle} vs {p2handle}
      </h3>
      <h4>
        {p1points} - {p2points}
      </h4>
      <p>{ended ? resultMessage : timer}</p>
      <table>
        <tr>
          <th>Problems</th>
          <th>Points</th>
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
