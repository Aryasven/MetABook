
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import bookshelfImg from "./assets/bookshelf.png";

const dummyUsers = [
  {
    username: "alice",
    password: "123",
    stories: [{ type: "review", text: "Loved The Alchemist!" }],
    books: [
      {
        id: "1",
        title: "The Alchemist",
        thumbnail: "https://books.google.com/books/content?id=1&printsec=frontcover&img=1&zoom=1"
      }
    ]
  },
  {
    username: "bob",
    password: "456",
    stories: [{ type: "swap", text: "Swapping Sapiens this week!" }],
    books: [
      {
        id: "2",
        title: "Sapiens",
        thumbnail: "https://books.google.com/books/content?id=2&printsec=frontcover&img=1&zoom=1"
      }
    ]
  }
];

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const StoryCircle = ({ user, onClick }) => {
  const color = {
    review: "ring-blue-500",
    swap: "ring-green-500",
    giveaway: "ring-purple-500"
  }[user.stories[0]?.type] || "ring-gray-300";

  return (
    <div onClick={() => onClick(user)} className={`w-20 h-20 rounded-full ring-4 ${color} ring-offset-2 flex items-center justify-center cursor-pointer hover:scale-105 transition`}>
      <img src="https://via.placeholder.com/60" alt={user.username} className="w-16 h-16 rounded-full" />
    </div>
  );
};

const Home = ({ users, onStoryClick }) => (
  <div className="p-4 space-y-6">
    <div className="flex gap-4 overflow-x-auto pb-4 border-b">
      {users.map((user) => (
        <div key={user.username} className="flex flex-col items-center text-sm">
          <StoryCircle user={user} onClick={onStoryClick} />
          <p className="mt-1">{user.username}</p>
        </div>
      ))}
    </div>
    <div className="overflow-y-auto space-y-10 max-h-[75vh]">
      {users.map((user) => (
        <div key={user.username} className="w-[400px]">
          <h3 className="font-semibold text-center text-lg mb-1">{user.username}'s Shelf</h3>
          <div className="relative w-full h-[600px] bg-cover" style={{ backgroundImage: `url(${bookshelfImg})` }}>
            {user.books.map((book, idx) => {
              const shelf = Math.floor(idx / 3) % ShelfY.length;
              const posX = shelfLefts[idx % 3];
              return (
                <img
                  key={book.id}
                  src={book.thumbnail}
                  alt={book.title}
                  className="absolute cursor-pointer hover:scale-110 transition"
                  title={book.title}
                  style={{
                    top: ShelfY[shelf] - 100,
                    left: posX,
                    width: "80px",
                    height: "100px"
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [storyUser, setStoryUser] = useState(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users"));
    if (!storedUsers) {
      localStorage.setItem("users", JSON.stringify(dummyUsers));
      setUsers(dummyUsers);
    } else {
      setUsers(storedUsers);
    }

    const currentUser = localStorage.getItem("loggedInUser");
    if (currentUser) {
      const match = (storedUsers || dummyUsers).find((u) => u.username === currentUser);
      if (match) setUser(match);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  return (
    <Router>
      <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex gap-4">
          <Link to="/" className="font-semibold hover:underline">Home</Link>
        </div>
        <div className="flex gap-4">
          {user ? (
            <button onClick={logout} className="hover:underline">Sign Out</button>
          ) : (
            <Link to="/login" className="hover:underline">Login</Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home users={users} onStoryClick={setStoryUser} />} />
      </Routes>

      {storyUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button onClick={() => setStoryUser(null)} className="absolute top-2 right-2">✖</button>
            <h2 className="text-xl font-bold">{storyUser.username}'s Story</h2>
            <p className="mt-4">{storyUser.stories[0]?.text}</p>
          </div>
        </div>
      )}
    </Router>
  );
}
