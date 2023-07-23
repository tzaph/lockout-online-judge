import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export function isEmailValid(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isPasswordMatch(pass, confirmPass) {
  if (pass !== confirmPass) {
    return false;
  }
  return true;
}

export function isPasswordLong(pass) {
  if (pass.length < 6) {
    return false;
  }
  return true;
}

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const register = useAuth()?.register;
  const addUserInformationToDatabase = useAuth()?.addUserInformationToDatabase;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid(email)) {
      return setError("Please enter a valid email!");
    }
    if (!isPasswordMatch(password, confirmPassword)) {
      return setError("Passwords do not match!");
    }
    if (!isPasswordLong(password)) {
      return setError("Password must be at least 6 characters long!");
    }
    try {
      await register(email, password);
      await addUserInformationToDatabase();
      setLoading(true);
      setError("");
      navigate("/");
    } catch {
      setError("Failed to create a new account");
    }
    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <h2>Register</h2>
      {error && <Alert variant="danger">{error}</Alert>}
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
        <label for="confirm-password">Confirm Password</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="********"
          id="confirmPassword"
          name="confirmPassword"
        />
        <button disabled={loading} type="submit">
          Register
        </button>
      </form>
      <div className="link-button">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;
