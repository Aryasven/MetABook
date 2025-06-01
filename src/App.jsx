import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import Home from "./Home"
import Navbar from "./Navbar";
import Login from "./Login";
import Register from "./Register";
import ShelfView from "./tabs/ShelfView";
import UserProfileView from "./tabs/UserProfileView";
import SidebarLayout from "./SidebarLayout";
import AddBooks from "./tabs/AddBooksTab";
import SeeMyShelf from "./tabs/SeeMyShelfTab";
import UserStories from "./tabs/UserStoriesTab";
import AboutMe from "./tabs/AboutMeTab";
import AddReviews from "./tabs/AddReviewsTab";
import { UserShelves } from "./tabs/UserShelvesTab";
import CommunitiesTab from "./tabs/CommunitiesTab";
import BookExchangeTab from "./tabs/BookExchangeTab";
import FindFriends from "./tabs/FindFriends";
import { Contribute } from "./Contribute";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./index.css";
import { AuthProvider, useAuth } from "./useAuth";

// ProtectedRoute component to handle authentication checks
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Give auth a moment to initialize before redirecting
    const checkAuth = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(checkAuth);
  }, []);
  
  if (loading) {
    // Show nothing while checking auth status
    return null;
  }
  
  if (!currentUser) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" />;
  }
  
  return children;
};

// AuthRedirect component to redirect authenticated users away from auth pages
const AuthRedirect = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Give auth a moment to initialize before redirecting
    const checkAuth = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(checkAuth);
  }, []);
  
  if (loading) {
    // Show nothing while checking auth status
    return null;
  }
  
  if (currentUser) {
    // Redirect to home if user is already authenticated
    return <Navigate to="/tabs" replace />;
  }
  
  return children;
};

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from Firestore instead of localStorage
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const userData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    fetchUsers();
    
    // Expose the setUsers function globally for components to update user data
    window.updateUsers = (updatedUsers) => {
      setUsers(updatedUsers);
    };
    
    return () => {
      // Clean up the global function when component unmounts
      delete window.updateUsers;
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          } />
          <Route path="/register" element={
            <AuthRedirect>
              <Register />
            </AuthRedirect>
          } />
          <Route path="/shelf/:username" element={<ShelfView />} />
          <Route path="/user/:username" element={<UserProfileView />} />
          <Route path="/tabs" element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Home users={users} />} />
            <Route path="about-me" element={<AboutMe />} />
            <Route path="add-books" element={<AddBooks />} />
            <Route path="see-my-shelf" element={<SeeMyShelf />} />
            <Route path="add-reviews" element={<AddReviews />} />
            <Route path="find-friends" element={<FindFriends />} />
            <Route path="stories" element={<UserStories />} />
            <Route path="shelves" element={<UserShelves />} />
            <Route path="communities" element={<CommunitiesTab />} />
            <Route path="book-exchange" element={<BookExchangeTab />} />
            <Route path="contribute" element={<Contribute />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}