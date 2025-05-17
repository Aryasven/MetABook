// Login.jsx (with Firebase Auth)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/tabs");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex justify-center items-center px-4 text-white overflow-hidden">
      {/* glowing graphics */}
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-purple-700 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-2xl animate-pulse" />

      {/* login card */}
      <div className="z-20 bg-gray-950 shadow-2xl rounded-lg p-10 max-w-md w-full space-y-6 border border-gray-700">
        <img src={logo} alt="logo" className="w-44 mx-auto" />
        <input
          className="w-full p-3 rounded border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-3 rounded border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
