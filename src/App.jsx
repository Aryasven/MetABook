
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import bookshelfImg from "./assets/bookshelf.png";

const dummyUsers = [
  {
    username: "alice",
    password: "123",
    stories: [{ type: "review", text: "Just finished The Alchemist!" }],
    books: [
      {
        id: "1",
        title: "The Alchemist",
        thumbnail: "https://books.google.com/books/content?id=1&printsec=frontcover&img=1&zoom=1&source=gbs_api"
      },
      {
        id: "2",
        title: "Atomic Habits",
        thumbnail: "https://books.google.com/books/content?id=2&printsec=frontcover&img=1&zoom=1&source=gbs_api"
      }
    ]
  },
  {
    username: "bob",
    password: "456",
    stories: [{ type: "swap", text: "Swapping Sapiens!" }],
    books: [
      {
        id: "3",
        title: "Sapiens",
        thumbnail: "https://books.google.com/books/content?id=3&printsec=frontcover&img=1&zoom=1&source=gbs_api"
      }
    ]
  }
];

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const StoryRing = ({ type }) => {
  const color = {
    review: "ring-blue-500",
    swap: "ring-green-500",
    giveaway: "ring-purple-500"
  }[type] || "ring-gray-300";
  return `rounded-full ring-4 ${color}`;
};

const Home = ({ users }) => {
  return (
    <div className="p-4">
      <div className="flex gap-4 overflow-x-auto mb-4">
        {users.map((user) => (
          <div key={user.username} className="flex flex-col items-center min-w-[80px]">
            <div className={StoryRing(user.stories[0]?.type)}>
              <img src="https://via.placeholder.com/60" alt="" className="rounded-full" />
            </div>
            <p className="text-sm mt-1">{user.username}</p>
          </div>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[600px] space-y-8">
        {users.map((user) => (
          <div key={user.username} className="mb-8">
            <p className="font-bold text-lg mb-1">{user.username}'s Shelf</p>
            <div className="relative w-[400px] h-[600px] bg-cover" style={{ backgroundImage: `url(${bookshelfImg})` }}>
              {user.books.map((book, idx) => {
                const shelf = Math.floor(idx / 3) % ShelfY.length;
                const posX = shelfLefts[idx % 3];
                return (
                  <img
                    key={book.id}
                    src={book.thumbnail}
                    alt={book.title}
                    className="absolute"
                    style={{
                      top: ShelfY[shelf] - 100,
                      left: posX,
                      width: `80px`,
                      height: `100px`
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
};

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = () => {
    const user = dummyUsers.find((u) => u.username === username && u.password === password);
    if (user) {
      setUser(user);
      localStorage.setItem("loggedInUser", username);
      navigate(`/profile/${user.username}`);
    } else {
      alert("Invalid login");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Login</h2>
      <input className="border p-2 mr-2" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="border p-2 mr-2" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={login} className="bg-blue-500 text-white px-4 py-2">Login</button>
    </div>
  );
};

const Profile = ({ users }) => {
  const { username } = useParams();
  const user = users.find((u) => u.username === username);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4 font-bold">{user.username}'s Bookshelf</h2>
      <div className="relative w-[400px] h-[600px] bg-cover" style={{ backgroundImage: `url(${bookshelfImg})` }}>
        {user.books.map((book, idx) => {
          const shelf = Math.floor(idx / 3) % ShelfY.length;
          const posX = shelfLefts[idx % 3];
          return (
            <img
              key={book.id}
              src={book.thumbnail}
              alt={book.title}
              className="absolute"
              style={{
                top: ShelfY[shelf] - 100,
                left: posX,
                width: `80px`,
                height: `100px`
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("loggedInUser");
    if (stored) {
      const u = dummyUsers.find((u) => u.username === stored);
      if (u) setUser(u);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  return (
    <Router>
      <nav className="p-4 bg-gray-200 flex gap-4 sticky top-0 z-10">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to={`/profile/${user.username}`}>Profile</Link>
            <button onClick={logout}>Sign Out</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Home users={dummyUsers} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/profile/:username" element={<Profile users={dummyUsers} />} />
      </Routes>
    </Router>
  );
}
