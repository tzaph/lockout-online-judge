import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      register(email, password);
      setLoading(true);
      setError('');
      navigate('/');
    } catch {
      setError('Failed to create a new account');
    }
    setLoading(false);
  }

  return (
    <div className="auth-form-container">
      <h2>Register</h2>
      {error && <Alert variant='danger'>{error}</Alert>}
      <form className="register-form" onSubmit={handleSubmit}>
        <label for="email">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="youremail@gmail.com"
          id="email"
          name="email"
        />
        <label for="password">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="********"
          id="password"
          name="password"
        />
        <button disabled={loading} type="submit">Register</button>
      </form>
      <div className="link-button">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  )
}

export default Register;