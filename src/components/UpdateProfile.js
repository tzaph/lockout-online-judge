import React, { useEffect, useState } from 'react'
import { Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { getDatabase, ref, get, child } from "firebase/database";
import { Link, useNavigate } from 'react-router-dom';

export default function UpdateProfile() {
  const [data, setData] = useState({
    codeforcesHandle:"",
    email:"",
    name:"",
    uid:""
  })
  const { currentUser, updateName, updateCodeforcesHandle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async(e) => {
    e.preventDefault();

    try {
      await updateName(name);
      await updateCodeforcesHandle(cfHandle);
      setLoading(true);
      setError('');
      navigate('/');
      navigate(0);
    } catch {
      setError('Failed to update profile');
    }
    setLoading(false);
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
  useEffect(() => { Getdata(); }, [])

  const [name, setName] = useState(data.name);
  const [cfHandle, setCfhandle] = useState(data.codeforcesHandle);

  return (
    <div className="auth-form-container">
      <h2>Update Profile</h2>
      {error && <Alert variant='danger'>{error}</Alert>}
      <form className="register-form" onSubmit={handleSubmit}>
        <label for="name">Name</label>
        <input
          onChange={(e) => setName(e.target.value)}
          type="name"
          defaultValue={data.name}
          id="name"
          name="name"
        />
        <label for="cfHandle">Codeforces Handle</label>
        <input
          onChange={(e) => setCfhandle(e.target.value)}
          type="cfHandle"
          defaultValue={data.codeforcesHandle}
          id="cfHandle"
          name="cfHandle"
        />
        <button disabled={loading} type="submit">Update</button>
      </form>
      <div className="link-button">
        <Link to="/">Cancel</Link>
      </div>
    </div>
  );
}
