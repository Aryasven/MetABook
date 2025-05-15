import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem("loggedInUser", username);
      setUser(user);
      navigate("/home");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <input className="border p-2 w-full mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="border p-2 w-full mb-4" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
    </div>
  );
}
