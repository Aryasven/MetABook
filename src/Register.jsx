
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register({ setUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=\${searchTerm}&maxResults=6`);
    const data = await res.json();
    setSearchResults(data.items || []);
  };

  const toggleFavorite = (book) => {
    const already = favorites.find((b) => b.id === book.id);
    if (already) {
      setFavorites(favorites.filter((b) => b.id !== book.id));
    } else {
      setFavorites([...favorites, book]);
    }
  };

  const handleRegister = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.username === username)) {
      alert("User already exists!");
      return;
    }
    const newUser = {
      username,
      email,
      password,
      favorites,
      stories: [],
      books: []
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedInUser", username);
    setUser(newUser);
    navigate("/home");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-2">Register</h2>
      <input className="border p-2 w-full" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Select Your Favorite Books</h3>
        <div className="flex gap-2 mb-2">
          <input className="border p-2 flex-1" placeholder="Search books..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 rounded">Search</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {searchResults.map((book) => (
            <div key={book.id} onClick={() => toggleFavorite(book)} className={`p-2 border rounded cursor-pointer hover:shadow \${favorites.find((b) => b.id === book.id) ? 'border-green-500' : ''}`}>
              <p className="text-sm font-medium">{book.volumeInfo.title}</p>
              {book.volumeInfo.imageLinks?.thumbnail && (
                <img src={book.volumeInfo.imageLinks.thumbnail} alt="cover" className="w-16 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleRegister} className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full">Create Account</button>
    </div>
  );
}
