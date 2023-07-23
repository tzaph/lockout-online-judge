import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getDatabase, update, ref, get, child } from "firebase/database";

export default function DuelHistory() {
  const [data, setData] = useState({});
  const [arr, setArr] = useState([]);
  const [msgArr, setMsgArr] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emptyHistory, setEmptyHistory] = useState(false);
  const [msg, setMsg] = useState("");
  const currentUser = useAuth()?.currentUser;

  const Getdata = () => {
    get(child(ref(getDatabase()), "users/" + currentUser.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };
  useEffect(() => {
    Getdata();
  }, []);

  const refreshPage = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);

    let li = data.duelHistory;
    const tmparr = [];
    const tmpmsgarr = [];

    if (li == undefined) {
      await update(ref(getDatabase(), "users/" + currentUser.uid), {
        duelHistory: tmparr,
      });
      setEmptyHistory(true);
      setMsg("You do not have any recent duels");
      return;
    }
    let len = li.length;

    if (len == 0) {
      setEmptyHistory(true);
      setMsg("You do not have any recent duels");
      return;
    }

    for (let i = 0; i < len; i++) {
      if (i == 0 || li[i].roomCode != li[i - 1].roomCode) {
        tmparr.push(li[i]);
        tmpmsgarr.push(
          li[i].duelType + " " + li[i].roomCode + " vs. " + li[i].opponent.name
        );
      }
    }
    await update(ref(getDatabase(), "users/" + currentUser.uid), {
      duelHistory: tmparr,
    });
    setArr(tmparr);
    tmpmsgarr.reverse();
    setMsgArr(tmpmsgarr);
  };

  return (
    <div className="profile-container">
      <button disabled={loading} onClick={refreshPage}>
        Refresh Duel History List
      </button>
      <p>{emptyHistory ? msg : null}</p>
      <table>
        {msgArr.map((val) => {
          return <p>{val}</p>;
        })}
      </table>
    </div>
  );
}
