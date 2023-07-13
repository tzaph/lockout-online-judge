import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { getDatabase, ref, get, child } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UpdateProfile() {
  const [data, setData] = useState({
    codeforcesHandle: "",
    email: "",
    name: "",
    uid: "",
  });
  const currentUser = useAuth()?.currentUser;
  const updateName = useAuth()?.updateName;
  const updateCodeforcesHandle = useAuth()?.updateCodeforcesHandle;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState({
    contestId: "",
    index: "",
    problemLink: "",
    problemName: "",
  });
  const [submissions, setSubmissions] = useState([]);
  const [codeforcesHandleTaken, setCodeforcesHandleTaken] = useState(false);
  const navigate = useNavigate();

  function listRecentSubmissions(codeforcesHandle) {
    return axios
      .get(
        `https://codeforces.com/api/user.status?handle=${codeforcesHandle}&from=1&count=10`
      )
      .then((res) => {
        setSubmissions(res.data.result);
      })
      .catch((err) => {
        throw err.response.data.comment;
      });
  }

  const isCodeforcesHandleTaken = async (codeforcesHandle) => {
    const db = getDatabase();
    const listOfCodeforcesHandle = [];
    await get(child(ref(db), "users")).then((snapshot) => {
      snapshot.forEach((documentSnapshot) => {
        listOfCodeforcesHandle.push(documentSnapshot.val().codeforcesHandle);
      });
    });
    setCodeforcesHandleTaken(listOfCodeforcesHandle.includes(codeforcesHandle));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateName(e.target.name.value);
    if (data.codeforcesHandle == e.target.cfHandle.value) {
      setLoading(true);
      setError("");
      navigate("/");
      navigate(0);
      setLoading(false);
      return;
    }
    try {
      await isCodeforcesHandleTaken(e.target.cfHandle.value);
      if (codeforcesHandleTaken) {
        setError(`Codeforces Handle is already taken`);
        return;
      }
      await listRecentSubmissions(e.target.cfHandle.value);
      submissions.map((sub) => {
        if (
          problem.contestId == sub.problem.contestId &&
          problem.problemIndex == sub.problem.index &&
          sub.verdict == "COMPILATION_ERROR"
        ) {
          updateCodeforcesHandle(e.target.cfHandle.value);
          setLoading(true);
          setError("");
          navigate("/");
          navigate(0);
        } else {
          setError(`Failed to verify Codeforces Handle`);
        }
      });
    } catch (err) {
      setError(`Failed to update profile, ${err}`);
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

  const generateProblem = async () => {
    const db = getDatabase();
    await get(child(ref(db), "problems/800")).then((snapshot) => {
      let newProblem =
        snapshot.val().problemsetList[
          Math.floor(Math.random() * snapshot.val().problemsetList.length)
        ];
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
    });
  };

  useEffect(() => {
    Getdata();
    generateProblem();
  }, []);

  return (
    <div className="auth-form-container">
      <h2>Update Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <form className="register-form" onSubmit={handleSubmit}>
        <label for="name">Name</label>
        <input type="name" defaultValue={data.name} id="name" name="name" />
        <label for="cfHandle">Codeforces Handle</label>
        <input
          type="cfHandle"
          defaultValue={data.codeforcesHandle}
          id="cfHandle"
          name="cfHandle"
        />
        <button disabled={loading} type="submit">
          Update
        </button>
      </form>
      Please submit a compile error to{" "}
      <a href={problem.problemLink} target="_blank">
        {problem.problemName}
      </a>{" "}
      to verify your Codeforces handle.
      <div className="link-button">
        <Link to="/">Cancel</Link>
      </div>
    </div>
  );
}
