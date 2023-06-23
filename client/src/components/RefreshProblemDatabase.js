import React, { useEffect, useState } from 'react'
import { Alert } from 'react-bootstrap';
import { getDatabase, ref, set, update } from "firebase/database";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios"

export default function RefreshProblemDatabase() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    for (let ratingValue = 800; ratingValue <= 3600; ratingValue += 100) {
      setTimeout(() => {
        if (ratingValue <= 3500) {
          setMessage("Loading problems of rating " + ratingValue)
          axios.get(`https://codeforces.com/api/problemset.problems?tags=`)
              .then(res => {
                let problemsetList = res.data.result.problems
                problemsetList = problemsetList.filter(
                  (problem) => 
                  problem.rating == ratingValue
                )

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
      {message == "Done!" ? <div className="link-button"><Link to="/">{message}</Link></div> : <p>{message}</p>}
    </div>
  );
}
