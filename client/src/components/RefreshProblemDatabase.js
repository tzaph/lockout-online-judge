import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { getDatabase, ref, set, update } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function RefreshProblemDatabase() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    for (let ratingValue = 800; ratingValue <= 3600; ratingValue += 100) {
      setTimeout(() => {
        if (ratingValue <= 3500) {
          setMessage("Loading problems of rating " + ratingValue);
          axios
            .get(`https://codeforces.com/api/problemset.problems?tags=`)
            .then((res) => {
              let problemsetList = res.data.result.problems;
              problemsetList = problemsetList.filter(
                (problem) => problem.rating == ratingValue
              );

              const db = getDatabase();
              set(ref(db, "problems/" + ratingValue), {
                problemsetList: problemsetList,
              });
            })
            .catch((err) => {
              setError(err);
            });
        } else {
          setMessage("Done!");
        }
      }, 30 * (ratingValue - 700));
    }

    const db = getDatabase();
    set(ref(db, "rankedDuelParameters/" + "D"), {
      duelLength: 120,
      problemsetRatings: [800, 900, 1000, 1100, 1200],
      psrVariety: [0, 0, 0, 0, 0],
      lowerRating: 0,
      upperRating: 999
    });
    set(ref(db, "rankedDuelParameters/" + "C"), {
      duelLength: 90,
      problemsetRatings: [800, 900, 1000, 1100, 1200],
      psrVariety: [0, 0, 0, 0, 0],
      lowerRating: 1000,
      upperRating: 1199
    });
    set(ref(db, "rankedDuelParameters/" + "B"), {
      duelLength: 60,
      problemsetRatings: [800, 900, 1000, 1100, 1200],
      psrVariety: [0, 0, 0, 0, 0],
      lowerRating: 1200,
      upperRating: 1399
    });
    set(ref(db, "rankedDuelParameters/" + "A-"), {
      duelLength: 60,
      problemsetRatings: [900, 1000, 1100, 1200, 1400],
      psrVariety: [0, 0, 0, 1, 0],
      lowerRating: 1400,
      upperRating: 1699
    });
    set(ref(db, "rankedDuelParameters/" + "A"), {
      duelLength: 60,
      problemsetRatings: [1000, 1100, 1300, 1500, 1600],
      psrVariety: [0, 1, 1, 0, 0],
      lowerRating: 1700,
      upperRating: 1999
    });
    set(ref(db, "rankedDuelParameters/" + "A+"), {
      duelLength: 60,
      problemsetRatings: [1300, 1400, 1500, 1700, 1800],
      psrVariety: [0, 0, 1, 0, 0],
      lowerRating: 2000,
      upperRating: 2299
    });
    set(ref(db, "rankedDuelParameters/" + "S-"), {
      duelLength: 60,
      problemsetRatings: [1400, 1500, 1600, 1800, 1900],
      psrVariety: [0, 0, 1, 0, 1],
      lowerRating: 2300,
      upperRating: 2499
    });
    set(ref(db, "rankedDuelParameters/" + "S"), {
      duelLength: 60,
      problemsetRatings: [1500, 1700, 1800, 1900, 2100],
      psrVariety: [1, 0, 0, 1, 1],
      lowerRating: 2500,
      upperRating: 2699
    });
    set(ref(db, "rankedDuelParameters/" + "S+"), {
      duelLength: 60,
      problemsetRatings: [1700, 1900, 2100, 2200, 2300],
      psrVariety: [1, 1, 0, 0, 1],
      lowerRating: 2700,
      upperRating: 2999
    });
    set(ref(db, "rankedDuelParameters/" + "SS"), {
      duelLength: 60,
      problemsetRatings: [1800, 2000, 2100, 2300, 2500],
      psrVariety: [1, 0, 1, 1, 1],
      lowerRating: 3000,
      upperRating: 9999
    });
  }, []);

  return (
    <div className="auth-form-container">
      <h2>Refreshing Codeforces Problem Database</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message == "Done!" ? (
        <div className="link-button">
          <Link to="/">{message}</Link>
        </div>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
