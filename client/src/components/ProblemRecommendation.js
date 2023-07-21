import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, child } from "firebase/database";
import axios from "axios";

export default function ProblemRecommendation() {
  const [error, setError] = useState("");
  const [data, setData] = useState({
    codeforcesHandle: "",
    email: "",
    name: "",
    uid: "",
  });
  const currentUser = useAuth()?.currentUser;
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState({
    contestId: "",
    index: "",
    problemLink: "",
    problemName: "",
  });
  const [submissions, setSubmissions] = useState([]);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const generateProblem = async (rating) => {
    const db = getDatabase();
    let doneProblem = true;
    await get(child(ref(db), "problems/" + rating)).then((snapshot) => {
      while (doneProblem) {
        let newProblem =
          snapshot.val().problemsetList[
            Math.floor(Math.random() * snapshot.val().problemsetList.length)
          ];
        doneProblem = false;
        submissions.map((sub) => {
          if (
            newProblem.contestId == sub.problem.contestId &&
            newProblem.index == sub.problem.index &&
            sub.verdict == "OK"
          ) {
            doneProblem = true;
          } else {
            let linkUrl =
              "https://codeforces.com/contest/" +
              newProblem.contestId +
              "/problem/" +
              newProblem.index;
            let problemName =
              newProblem.contestId + newProblem.index + " - " + newProblem.name;
            setProblem({
              contestId: newProblem.contestId,
              problemIndex: newProblem.index,
              problemLink: linkUrl,
              problemName: problemName,
            });
          }
        });
      }
    });
  };

  function isValidRating(str) {
    if (str.trim() === "") {
      return false;
    }
    if (isNaN(str)) {
      return false;
    }
    if (str < 800 || str > 3500) {
      return false;
    }
    if (str % 100 != 0) {
      return false;
    }
    return true;
  }

  function listAllSubmissions(codeforcesHandle) {
    return axios
      .get(`https://codeforces.com/api/user.status?handle=${codeforcesHandle}`)
      .then((res) => {
        setSubmissions(res.data.result);
      })
      .catch((err) => {
        throw err.response.data.comment;
      });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    if (!isValidRating(e.target.rating.value)) {
      setError(
        `Rating should be an integer multiple of 100 between 800 and 3500`
      );
      return;
    }
    try {
      listAllSubmissions(data.codeforcesHandle);
      await generateProblem(e.target.rating.value);
      setLoading(true);
      setError("");
      setSuccess(true);
    } catch (err) {
      setError(`Failed to get problem recommendation, ${err}`);
    }
    setLoading(false);
  };

  const Getdata = () => {
    get(child(ref(getDatabase()), "users/" + currentUser.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        } else {
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    Getdata();
  }, []);

  return (
    <div className="auth-form-container">
      <h2>Problem Recommendation</h2>
      {success ? (
        <a href={problem.problemLink} target="_blank">
          {problem.problemName}
        </a>
      ) : (
        <></>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      <form className="problem-recommendation-form" onSubmit={handleSubmit}>
        <label for="rating">Rating (800 - 3500)</label>
        <input type="rating" defaultValue={800} id="rating" name="rating" />
        <button disabled={loading} type="submit">
          Get New Problem Recommendation
        </button>
      </form>
      <div className="link-button">
        <Link to="/">Cancel</Link>
      </div>
    </div>
  );
}
