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
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
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

  useEffect(() => {
    // Check for redirect result when component mounts
    const checkRedirectResult = async () => {
      try {
        // Check if we're returning from an iOS PWA auth flow
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // For iOS PWA, check if user is authenticated after returning from Safari
        if (isIOS && isPWA && window.location.href.includes('mode=handleRedirect')) {
          console.log("Detected return from iOS PWA auth flow");
          
          // Wait a moment for auth state to be established
          setTimeout(async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
              console.log("User authenticated via iOS PWA flow:", currentUser.email);
              try {
                await handleGoogleUserData(currentUser);
                navigate("/tabs");
              } catch (err) {
                console.error("Error handling user data:", err);
              }
            } else {
              console.log("No user found after iOS PWA auth flow");
            }
          }, 1000);
          return;
        }
        
        // Standard redirect check for non-iOS PWA
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("User authenticated via redirect:", result.user.email);
          await handleGoogleUserData(result.user);
          navigate("/tabs");
        }
      } catch (err) {
        console.error("Auth error:", err);
        if (err.code !== 'auth/cancelled-popup-request' && 
            err.code !== 'auth/popup-closed-by-user') {
          alert("Sign-in failed: " + err.message);
        }
      }
    };
    
    checkRedirectResult();
  }, []);

  // Helper function to handle user data after successful Google auth
  const handleGoogleUserData = async (user) => {
    // Check if user document already exists before creating/updating
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      // Document exists, only update authentication-related fields
      await updateDoc(userDocRef, {
        email: user.email,
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
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      
      // Check if running in a PWA on iOS
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // iOS PWA OAuth workaround based on Progressier article
      if (isIOS && isPWA) {
        // According to Progressier, Google OAuth simply doesn't work in iOS PWAs
        // due to third-party cookie restrictions in Safari's WKWebView
        
        // Store the current URL to return to
        sessionStorage.setItem('returnToUrl', window.location.href);
        
        // Open in Safari browser to handle the authentication
        // This forces the auth flow to happen in the main Safari browser
        // which has proper cookie handling
        window.location.href = 'https://metabook-464c5.firebaseapp.com/__/auth/handler?provider=google';
        return;
      } else {
        // Use popup for desktop browsers
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

        // For popup flow, process the user data
        await handleGoogleUserData(user);
        navigate("/tabs");
      }
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