
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import FloatingFeatures from "./FloatingFeatures";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-indigo-50 to-pink-100 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <FloatingFeatures />
      <img src={logo} alt="MetaBook Logo" className="w-64 mb-4 animate-fade-in" />
      <h1 className="text-5xl font-bold mb-2 animate-fade-in delay-150">Met-a-Book</h1>
      <p className="text-xl text-gray-700 mb-4 animate-fade-in delay-300">You're on a date with a book.</p>
      <p className="text-2xl text-purple-700 italic mb-8 animate-fade-in delay-500">Coming soon…</p>
      <div className="flex gap-4 animate-fade-in delay-700">
        <button onClick={() => navigate("/register")} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">Register</button>
        <button onClick={() => navigate("/login")} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
      </div>
    </div>
  );
}
