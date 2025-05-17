// Navbar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import { doc, getDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "./firebase";
import { useAuth } from "./useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setProfile(snap.data());
    };
    fetch();
  }, [currentUser]);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 text-white shadow-md z-50">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}> 
        <img src={logo} alt="logo" className="h-10" />
        <span className="text-xl font-bold hidden md:inline">Met·A·Book</span>
      </div>

      {profile && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 hidden sm:inline">Hi, {profile.displayName || currentUser?.displayName}</span>
          {profile.userImage && (
            <img
              src={profile.userImage}
              alt="profile"
              className="h-9 w-9 rounded-full border border-gray-700 object-cover"
            />
          )}
          <button
            onClick={() => {
              const auth = getAuth();
              signOut(auth).then(() => {
                navigate('/');
              });
            }}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}