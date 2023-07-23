import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { getDatabase, ref, get, child } from "firebase/database";

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

export default function Dashboard() {
  const [error, setError] = useState("");
  const [data, setData] = useState({});
  const currentUser = useAuth()?.currentUser;
  const logout = useAuth()?.logout;
  const navigate = useNavigate();

  const handleLogout = async () => {
    setError("");
    try {
      await logout();
      setError("");
      navigate("/login");
    } catch {
      setError("Failed to logout");
    }
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
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="profile-container">
        <h2>Profile</h2>
        <table>
          <tr align="left">
            <td>Email:</td>
            <td>{data.email}</td>
          </tr>
          <tr align="left">
            <td>Name:</td>
            <td>{data.name}</td>
          </tr>
          <tr align="left">
            <td>Codeforces Handle:</td>
            <td>{data.codeforcesHandle}</td>
          </tr>
          <tr align="left">
            <td>Rating:</td>
            <td>{data.rating} ({rankLetter(data.rating)} rank)</td>
          </tr>
        </table>
        <br />
        <Link to="/update-profile">Update Profile</Link>
        {data.admin ? (
          <Link to="/refresh-problem-database">Refresh Problem Database</Link>
        ) : null}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <button className="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
