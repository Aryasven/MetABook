
import React from "react";
import { Link } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import { Button } from "@/components/ui/button";

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-10 w-10 rounded" />
        <span className="font-bold text-lg text-purple-700">Met·A·Book</span>
      </div>
      <div className="flex gap-4 items-center">
        <Link to="/home">
          <Button variant="ghost">Home</Button>
        </Link>
        {user && (
          <Link to="/profile">
            <Button variant="ghost">Profile</Button>
          </Link>
        )}
        {!user ? (
          <>
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </>
        ) : (
          <Button variant="destructive" onClick={onLogout}>Sign Out</Button>
        )}
      </div>
    </nav>
  );
}
