import React, { useEffect, useState } from 'react'
import { Alert } from 'react-bootstrap';
import { getDatabase, ref, set, update } from "firebase/database";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios"

export default function RefreshProblemDatabase() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ratingValues = [
    800, 900, 1000, 1100, 1200,
    1300, 1400, 1500, 1600, 1700,
    1800, 1900, 2000, 2100, 2200,
    2300, 2400, 2500, 2600, 2700,
    2800, 2900, 3000, 3100, 3200,
    3300, 3400, 3500
  ]

  const refreshProblems = async() => {
    try {
      console.log("hi");
      const db = getDatabase()
      ratingValues.map(ratingValue => {
        set(ref(db, 'problems/' + ratingValue), {
          problemsetList: []
        });
      })

      const apiCall = await axios.get(
        `https://codeforces.com/api/problemset.problems?tags=`
      );
      ratingValues.map(ratingValue => {
        console.log(ratingValue);
        let problemsetList = apiCall.data.result.problems;
        problemsetList.filter(
          (problem) => 
          problem.rating >= ratingValue && problem.rating <= ratingValue
        );
        console.log(problemsetList.length);

        const db = getDatabase()
        update(ref(db, 'problems/' + ratingValue), {
          problemsetList: problemsetList
        });
      })

      setLoading(true);
      setError('');
      navigate('/');
      navigate(0);
    } catch (err) {
      setError(`Failed to refresh problems, ${err}`);
    }
    setLoading(false);
  }

  useEffect(() => {
    const apiCall = axios.get(
      `https://codeforces.com/api/problemset.problems?tags=`
    );

    for (let ratingValue = 800; ratingValue <= 3600; ratingValue += 100) {
      setTimeout(() => {
        if (ratingValue <= 3500) {
          setMessage(ratingValue)
          axios.get(`https://codeforces.com/api/problemset.problems?tags=`)
              .then(res => {
                console.log(ratingValue);
                let problemsetList = res.data.result.problems
                problemsetList = problemsetList.filter(
                  (problem) => 
                  problem.rating >= ratingValue && problem.rating <= ratingValue
                )
                problemsetList.map((problem) => {
                  console.log(problem.rating);
                })

                const db = getDatabase()
                set(ref(db, 'problems/' + ratingValue), {
                  problemsetList: problemsetList
                });
              }).catch (err => {
                setError(err)
              })
        } else {
          setMessage("Done!")
        }
      }, 30 * (ratingValue - 700))
    }
  }, [])

  return (
    <div className="auth-form-container">
      <h2>Refreshing Codeforces Problem Database</h2>
      {error && <Alert variant='danger'>{error}</Alert>}
      <div className="link-button">
        <Link to="/">{message}</Link>
      </div>
    </div>
  );
}
