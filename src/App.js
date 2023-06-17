import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UpdateProfile from './components/UpdateProfile';
import RefreshProblemDatabase from './components/RefreshProblemDatabase';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route exact path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
            <Route path="/refresh-problem-database" element={<PrivateRoute><RefreshProblemDatabase /></PrivateRoute>} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
    
  );
}

export default App;