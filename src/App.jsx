import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import Home from "./Home";
import Profile from "./Profile";
import Navbar from "./Navbar";
import Login from "./Login";
import Register from "./Register";

const dummyUsers = [
  {
    username: "aparna",
    password: "123",
    stories: [{ type: "review", text: "Loved The Alchemist!" }],
    books: [
      {
        id: "1",
        title: "The Alchemist",
        thumbnail: "https://via.placeholder.com/80x100?text=Book"
      }
    ]
  },
  {
    username: "ramesh",
    password: "456",
    stories: [{ type: "swap", text: "Swapping Sapiens this week!" }],
    books: [
      {
        id: "2",
        title: "Sapiens",
        thumbnail: "https://via.placeholder.com/80x100?text=Sapiens"
      }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [storyUser, setStoryUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("users");
    if (!stored) {
      localStorage.setItem("users", JSON.stringify(dummyUsers));
      setUsers(dummyUsers);
    } else {
      setUsers(JSON.parse(stored));
    }

    const currentUser = localStorage.getItem("loggedInUser");
    if (currentUser) {
      const found = JSON.parse(stored || "[]").find((u) => u.username === currentUser);
      if (found) setUser(found);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<Home users={users} onStoryClick={setStoryUser} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
      </Routes>
    </Router>
  );
}
