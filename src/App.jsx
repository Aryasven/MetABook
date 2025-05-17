import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import Home from "./Home"
import Navbar from "./Navbar";
import Login from "./Login";
import Register from "./Register";
import ShelfView from "./tabs/ShelfView";
import SidebarLayout from "./SidebarLayout";
import AddBooks from "./tabs/AddBooksTab";
import SeeMyShelf from "./tabs/SeeMyShelfTab";
import UserStories from "./tabs/UserStoriesTab";
import AboutMe from "./tabs/AboutMeTab";
import AddReviews from "./tabs/AddReviewsTab";
import { UserShelves } from "./tabs/UserShelvesTab";
import { Communities } from "./tabs/CommunitiesTab"
import { Contribute } from "./Contribute";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./index.css";
import { AuthProvider, useAuth } from "./useAuth";

// ProtectedRoute component to handle authentication checks
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Removed dummy users as we're now using Firestore

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
  }, []);

  // We'll define ProtectedRoute inside the AuthProvider context

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shelf/:username" element={<ShelfView />} />
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
            <Route path="stories" element={<UserStories />} />
            <Route path="shelves" element={<UserShelves />} />
            <Route path="communities" element={<Communities />} />
            <Route path="contribute" element={<Contribute />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
