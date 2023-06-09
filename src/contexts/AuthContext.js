import React, { useState, useContext, useEffect } from 'react'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { getDatabase, ref, set, update, get } from "firebase/database"
const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }){
  const [currentUser, setCurrentUser] = useState()
  const [returnValue, setReturnValue] = useState()
  const [loading, setLoading] = useState(true)

  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  function updateName(name) {
    updateProfile(auth.currentUser, {displayName: name})
    const db = getDatabase()
    update(ref(db, 'users/' + auth.currentUser.uid), {
      name: name
    });
  }

  function addUserInformationToDatabase() {
    const db = getDatabase()
    set(ref(db, 'users/' + auth.currentUser.uid), {
      email: auth.currentUser.email,
      uid: auth.currentUser.uid,
      codeforcesHandle: "",
      name: "",
    });
  }

  function updateCodeforcesHandle(codeforcesHandle) {
    const db = getDatabase()
    update(ref(db, 'users/' + auth.currentUser.uid), {
      codeforcesHandle: codeforcesHandle
    });
  }

  function getCodeforcesHandle(currentUser) {
    const db = getDatabase();
    setReturnValue("");
    get(ref(db, 'users/' + currentUser.uid)).then((snapshot) => {
      if (snapshot.exists()) {
        setReturnValue((snapshot.val()).codeforcesHandle);
      } else {
        
      }
    });
    return returnValue;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])
  

  const value = {
    register,
    login,
    logout,
    updateName,
    addUserInformationToDatabase,
    updateCodeforcesHandle,
    getCodeforcesHandle,
    currentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}