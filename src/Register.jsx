import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import { BookOpen, ArrowsLeftRight, Gift, Megaphone } from "phosphor-react";

const features = [
  { icon: BookOpen, label: "What I’m Into" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?" },
  { icon: Gift, label: "Take It, It’s Yours!" },
  { icon: Megaphone, label: "You Gotta Read This" }
];

export default function Register({ setUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.username === username)) {
      alert("User already exists!");
      return;
    }
    const newUser = {
      username,
      email,
      password,
      favorites: [],
      stories: [],
      books: []
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedInUser", username);
    setUser(newUser);
    navigate("/profile");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex justify-center items-center px-4">
      {/* floating features */}
      <div className="absolute top-1/4 left-4 hidden md:flex flex-col gap-6 z-10">
        {features.slice(0, 2).map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-purple-700">
            <Icon className="h-6 w-6" /> {label}
          </div>
        ))}
      </div>
      <div className="absolute top-1/4 right-4 hidden md:flex flex-col gap-6 z-10">
        {features.slice(2, 4).map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-purple-700">
            <Icon className="h-6 w-6" /> {label}
          </div>
        ))}
      </div>

      {/* form card */}
      <div className="z-20 bg-white shadow-xl rounded-lg p-8 max-w-md w-full space-y-6">
        <img src={logo} alt="logo" className="w-40 mx-auto" />
        <input
          className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleRegister}
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
