
import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex gap-4 font-semibold">
        <Link to="/home" className="hover:text-blue-600">Home</Link>
        {user && <Link to="/profile" className="hover:text-blue-600">Profile</Link>}
      </div>
      <div className="flex gap-4">
        {!user ? (
          <>
            <Link to="/login" className="hover:text-green-600">Login</Link>
            <Link to="/register" className="hover:text-green-600">Register</Link>
          </>
        ) : (
          <button onClick={onLogout} className="hover:text-red-600">Sign Out</button>
        )}
      </div>
    </nav>
  );
}
