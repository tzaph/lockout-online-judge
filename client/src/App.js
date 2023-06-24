import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UpdateProfile from './components/UpdateProfile';
import RefreshProblemDatabase from './components/RefreshProblemDatabase';
import RoomList from './components/RoomList';
import Lobby from './components/duel/Lobby';
import NavBar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import io from "socket.io-client";
const socket = io.connect("http://localhost:3001");

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <div className="full-container">
            <NavBar />
            <Routes>
              <Route exact path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
              <Route path="/refresh-problem-database" element={<PrivateRoute><RefreshProblemDatabase /></PrivateRoute>} />
              <Route path="/room-list" element={<PrivateRoute><RoomList /></PrivateRoute>} />
              <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </div>
    
  );
}

export default App;