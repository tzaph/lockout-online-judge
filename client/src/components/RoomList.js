import React, { useEffect, useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, child } from 'firebase/database';

import io from "socket.io-client";
const socket = io.connect("http://localhost:3001");

export default function RoomList() {
  const [data, setData] = useState({})
  const { currentUser } = useAuth();

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

  const [room, setRoom] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [isFull, setFull] = useState(false);
  const [isValid, setValid] = useState(true);
  const [started, setStarted] = useState(false);

  socket.on('roomFull', () => {
    setRoom("");
    setFull(true);
  });
  
  socket.on('joinedRoom', () => {
    setStarted(true);
  });

  function handleRoom (e) {
    setRoom(e.target.value);
  }

  const handleJoin = async (e) => {
    if (!room) {
      setValid(false);
      setTimeout(() => setValid(true), 5000);
      return;
    }

    // check if room was created before
    await get(child(ref(getDatabase()), 'duelRoom/' + room)).then((snapshot) => {
      if (snapshot.exists()) {
        setLoading(true);
        setError('');
        navigate('/lobby', {
          state: {
            p1: snapshot.val().players[0],
            p2: snapshot.val().players[1],
            roomID: room,
            startTime: snapshot.val().startTime
          }
        });
      } else {
        setCurrentRoom(room);
        socket.emit('joinRoom', data.codeforcesHandle, room);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  const [ready, setReady] = useState(false);
  const [player, setPlayer] = useState({});
  const [opponent, setOpponent] = useState({});

  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const moveToDuelRoom = async(p1, p2, ts) => {
    try {
      setLoading(true);
      setError('');
      navigate('/lobby', {
        state: {
          p1: p1,
          p2: p2,
          roomID: room,
          startTime: ts
        }
      });
    } catch (err) {
      setError(`Failed to update profile, ${err}`);
    }
    setLoading(false);
  }
  
  socket.on('startDuel', (p1, p2, ts) => {
    setPlayer(p1);
    setOpponent(p2);
    setReady(true);
    moveToDuelRoom(p1, p2, ts);
  });

  function handleLeave (e) {
    setStarted(false);
    setCurrentRoom("");
    socket.emit('leaveRoomWhenWaiting');
  }
  
  return (
    <div>
      {started ?
        <div className="auth-form-container">
          {ready ? 
            <div>
              <p>Both Players are ready!</p>
              {error && <Alert variant='danger'>{error}</Alert>}
            </div>
            :
            <div>
              <p>You are in room {currentRoom}, waiting for opponent!</p>
              <button onClick={handleLeave}>
                Back
              </button>
            </div>
          }
        </div>
        :
        <div className="auth-form-container">
          <h3>Enter room code to host/join</h3>
          <p>{isValid ? null : "Please enter room code!"}</p>
          <p>{isFull ? "Room is full" : null}</p>
          <input required name="code" type="text" value={room} onChange={handleRoom} maxLength={10}></input>
          <br />
          <button className ="goButton" onClick={handleJoin}>Go!</button>
          <div className="link-button">
            <Link to="/">Cancel</Link>
          </div>
        </div>
      }
    </div>
  )
}