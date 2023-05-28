import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
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

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="profile-container">
        <h2>Profile</h2>
        <label>Email: {currentUser.email}</label>
        <label>Name: {currentUser.displayName}</label>
        <br></br>
        <Link to="/update-profile">Update Profile</Link>
      </div>
      <button className="button" onClick={handleLogout}>Logout</button>
    </div>
  );
}