import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, child } from 'firebase/database';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [data, setData] = useState({})
  const currentUser = useAuth()?.currentUser;
  const logout = useAuth()?.logout;
  const navigate = useNavigate();

  const handleLogout = async() => {
    setError('');
    try {
      await logout();
      setError('');
      navigate('/login');
    } catch {
      setError('Failed to logout');
    }
  }

  const Getdata = () =>{
    get(child(ref(getDatabase()), 'users/' + currentUser.uid)).then((snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val())
      } else {
      }
    }).catch((error) => {
      console.error(error);
    });
  }
  useEffect(()=>{Getdata();},[])

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="profile-container">
        <h2>Profile</h2>
        <label>Email: {data.email}</label>
        <label>Name: {data.name}</label>
        <label>Codeforces Handle: {data.codeforcesHandle}</label>
        <br></br>
        <Link to="/update-profile">Update Profile</Link>
        <Link to="/refresh-problem-database">Refresh Problem Database</Link>
      </div>
      <button className="button" onClick={handleLogout}>Logout</button>
    </div>
  );
}