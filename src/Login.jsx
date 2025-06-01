// Login.jsx (with Firebase Auth + Google Login)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import {
  signInWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { EnvelopeSimple, LockSimple, ArrowRight, GoogleLogo } from "phosphor-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/tabs");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/tabs");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes for better user data
      provider.addScope('profile');
      provider.addScope('email');
      
      // Force account selection to avoid automatic login with cached credentials
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use signInWithRedirect for better mobile compatibility
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists before creating/updating
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Document exists, only update authentication-related fields
        // This preserves existing user data like books, stories, shelves
        await updateDoc(userDocRef, {
          // Only update these fields, preserving everything else
          email: user.email,
          // Update username only if it doesn't exist
          ...(userDocSnap.data().username ? {} : { username: user.displayName })
        });
      } else {
        // New user - create complete profile
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
    } catch (err) {
      console.error("Google sign-in error:", err);
      // More specific error handling
      if (err.code === 'auth/cancelled-popup-request') {
        alert("Sign-in popup was closed before completing authentication.");
      } else if (err.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show error
        console.log("User closed the sign-in popup");
      } else {
        alert("Google sign-in failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex justify-center items-center px-4 text-white overflow-hidden">
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-purple-700 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-2xl animate-pulse" />

      <div className="z-20 bg-gray-950 shadow-2xl rounded-lg p-10 max-w-md w-full space-y-6 border border-gray-700">
        <img src={logo} alt="logo" className="w-44 mx-auto" />

        <h2 className="text-2xl font-bold text-center">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeSimple size={20} className="text-gray-400" />
            </div>
            <input
              className="w-full pl-10 p-3 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockSimple size={20} className="text-gray-400" />
            </div>
            <input
              type="password"
              className="w-full pl-10 p-3 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg transition-all"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                Login <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded hover:bg-gray-200 transition mt-2"
        >
          <GoogleLogo size={20} weight="bold" /> Login with Google
        </button>

        <div className="text-center">
          <button
            onClick={handleForgotPassword}
            disabled={loading || resetSent}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {resetSent ? "Password reset email sent!" : "Forgot your password?"}
          </button>
        </div>

        <div className="flex items-center justify-center mt-4">
          <span className="text-gray-400 text-sm">Don't have an account?</span>
          <button
            onClick={() => navigate("/register")}
            className="ml-2 text-purple-400 hover:text-purple-300 text-sm"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}