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
    <>
      <div>Dashboard</div>
      <div className="profile-container">
        <h2>Profile</h2>
        Email: {currentUser.email}
        Name: {currentUser.displayName}
        <Link to="/update-profile">Update Profile</Link>
      </div>
      <button className="button" onClick={handleLogout}>Logout</button>
    </>
  );
}