// Register.jsx (with Firebase Auth + Google Sign-In)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import logo from "./assets/metabook_logo.png";
import { BookOpen, ArrowsLeftRight, Gift, Megaphone, GoogleLogo } from "phosphor-react";
import { getDoc, updateDoc } from "firebase/firestore";

const features = [
  { icon: BookOpen, label: "What I'm Into" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?" },
  { icon: Gift, label: "Take It, It's Yours!" },
  { icon: Megaphone, label: "You Gotta Read This" }
];

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const auth = getAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: username });
      await setDoc(doc(db, "users", result.user.uid), {
        username,
        email: result.user.email,
        name: "",
        books: [],
        stories: [],
        shelves: [
          {
            id: `shelf-${Date.now()}`,
            name: "Currently Reading",
            books: []
          }
        ]
      });
      navigate("/tabs");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

    // First check if the document exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Document exists, update only necessary fields
        await updateDoc(userDocRef, {
          username: user.displayName,
          email: user.email,
          // Don't overwrite books, stories, shelves if they exist
        });
      } else {
        // Document doesn't exist, create new one
        await setDoc(userDocRef, {
          username: user.displayName,
          email: user.email,
          name: "",
          books: [],
          stories: [],
          shelves: [
            {
              id: `shelf-${Date.now()}`,
              name: "Currently Reading",
              books: []
            }
          ]
        });
      }


      navigate("/tabs");
    } catch (error) {
      alert("Google sign-in failed: " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex justify-center items-center px-4 text-white overflow-hidden">
      {/* floating features left */}
      <div className="absolute top-1/4 left-6 hidden lg:flex flex-col gap-8 z-10">
        {features.slice(0, 2).map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-lg font-semibold text-purple-200 animate-fade-in">
            <Icon size={28} /> {label}
          </div>
        ))}
      </div>

      {/* floating features right */}
      <div className="absolute top-1/4 right-6 hidden lg:flex flex-col gap-8 z-10">
        {features.slice(2, 4).map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-lg font-semibold text-purple-200 animate-fade-in">
            <Icon size={28} /> {label}
          </div>
        ))}
      </div>

      {/* fancy blurred book graphics */}
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-purple-700 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-2xl animate-pulse" />

      {/* form card */}
      <div className="z-20 bg-gray-950 shadow-2xl rounded-lg p-10 max-w-md w-full space-y-6 border border-gray-700">
        <img src={logo} alt="logo" className="w-44 mx-auto" />
        <input
          className="w-full p-3 rounded border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          className="w-full p-3 rounded border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Email"
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
          onClick={handleRegister}
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition"
        >
          Create Account
        </button>
        <div className="text-center text-gray-400">or</div>
        <button
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded hover:bg-gray-200 transition"
        >
          <GoogleLogo size={20} weight="bold" /> Sign up with Google
        </button>
      </div>
    </div>
  );
}
