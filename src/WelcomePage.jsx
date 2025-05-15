
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col items-center justify-center text-center px-4">
      <img src={logo} alt="MetaBook Logo" className="w-60 mb-6" />
      <h1 className="text-5xl font-bold mb-2">MetaBook</h1>
      <p className="text-xl text-gray-700 mb-8">You're on a date with a book.</p>
      <p className="text-md text-gray-600 italic mb-12">Coming soon…</p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/register')} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">Register</button>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
      </div>
    </div>
  );
}
