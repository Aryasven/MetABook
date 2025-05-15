
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import Home from "./Home";
import Navbar from "./Navbar";

const dummyUsers = [
  {
    username: "alice",
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
    username: "bob",
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
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/home"
          element={
            <>
              <Navbar user={user} onLogout={logout} />
              <Home users={users} onStoryClick={setStoryUser} />
              {storyUser && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
                  <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
                    <button onClick={() => setStoryUser(null)} className="absolute top-2 right-2">✖</button>
                    <h2 className="text-xl font-bold">{storyUser.username}'s Story</h2>
                    <p className="mt-4">{storyUser.stories[0]?.text}</p>
                  </div>
                </div>
              )}
            </>
          }
        />
      </Routes>
    </Router>
  );
}
