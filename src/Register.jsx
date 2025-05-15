import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register({ setUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [favorites, setFavorites] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.username === username)) {
      alert("User already exists!");
      return;
    }
    const newUser = { username, email, password, favorites, stories: [], books: [] };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedInUser", username);
    setUser(newUser);
    navigate("/home");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <input className="border p-2 w-full mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <textarea className="border p-2 w-full mb-4" rows="3" placeholder="Favorite Books" value={favorites} onChange={(e) => setFavorites(e.target.value)} />
      <button onClick={handleRegister} className="bg-green-600 text-white px-4 py-2 rounded w-full">Create Account</button>
    </div>
  );
}
