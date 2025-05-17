import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { AboutMe } from "./tabs/AboutMeTab";
import { AddReviews} from "./tabs/AddReviewsTab";
import { UserShelves } from "./tabs/UserShelvesTab";
import { Communities } from "./tabs/CommunitiesTab"
import { Contribute } from "./Contribute";

// // Placeholder pages
// const Home = () => <div>Home</div>;
// const AddReviews = () => <div>Add Reviews (Coming Soon)</div>;
// const UserStories = () => <div>User Stories (Coming Soon)</div>;
// const UserShelves = () => <div>User Shelves (Coming Soon)</div>;
// const Communities = () => <div>Communities (Coming Soon)</div>;

import "./index.css";
import { AuthProvider } from "./useAuth";

const dummyUsers = [
  {
    username: "Aparna",
    password: "123",
    stories: [{ type: "review", text: "Loved The Alchemist!" }],
    books: [
      {
        id: "1",
        title: "The Alchemist",
        thumbnail: "https://via.placeholder.com/80x100?text=Book"
      }
    ]
  },
  {
    username: "Ramesh",
    password: "456",
    stories: [{ type: "swap", text: "Swapping Sapiens this week!" }],
    books: [
      {
        id: "2",
        title: "Sapiens",
        thumbnail: "https://via.placeholder.com/80x100?text=Sapiens"
      }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [storyUser, setStoryUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("users");
    if (!stored) {
      localStorage.setItem("users", JSON.stringify(dummyUsers));
      setUsers(dummyUsers);
    } else {
      setUsers(JSON.parse(stored));
    }

    const currentUser = localStorage.getItem("loggedInUser");
    if (currentUser) {
      const found = JSON.parse(stored || "[]").find((u) => u.username === currentUser);
      if (found) setUser(found);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  return (
    <AuthProvider>
      <Router>
        <Navbar user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/shelf/:username" element={<ShelfView />} />
          <Route path="/tabs" element={<SidebarLayout />}>
            <Route index element={<Home user={user} users={users} setUser={setUser} />} />
            <Route path="about-me" element={<AboutMe user={user} setUser={setUser} />} />
            <Route path="add-books" element={<AddBooks user={user} setUser={setUser} />} />
            <Route path="see-my-shelf" element={<SeeMyShelf user={user} setUser={setUser} />} />
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
