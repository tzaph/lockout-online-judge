import React, { useState } from 'react'
import { Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function UpdateProfile() {
  const [name, setName] = useState('');
  const { currentUser, updateName } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async(e) => {
    e.preventDefault();

    try {
      await updateName(name);
      setLoading(true);
      setError('');
      navigate('/');
    } catch {
      setError('Failed to update profile');
    }
    setLoading(false);
  }

  return (
    <div className="auth-form-container">
      <h2>Update Profile</h2>
      {error && <Alert variant='danger'>{error}</Alert>}
      <form className="register-form" onSubmit={handleSubmit}>
        <label for="name">Name</label>
        <input
          onChange={(e) => setName(e.target.value)}
          type="name"
          defaultValue={currentUser.displayName}
          id="name"
          name="name"
        />
        <button disabled={loading} type="submit">Update</button>
      </form>
      <div className="link-button">
        <Link to="/">Cancel</Link>
      </div>
    </div>
  );
}