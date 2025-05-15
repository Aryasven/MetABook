
import React, { useState } from "react";
import bookshelfImg from "./assets/bookshelf.png";

export default function Profile({ user, setUser }) {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [story, setStory] = useState("");

  const addBook = () => {
    if (!title) return;
    const updated = {
      ...user,
      books: [...user.books, { id: Date.now().toString(), title, thumbnail }]
    };
    setUser(updated);
    localStorage.setItem("users", JSON.stringify(updateLocalUsers(updated)));
    setTitle(""); setThumbnail("");
  };

  const addStory = () => {
    if (!story) return;
    const updated = {
      ...user,
      stories: [...user.stories, { type: "review", text: story }]
    };
    setUser(updated);
    localStorage.setItem("users", JSON.stringify(updateLocalUsers(updated)));
    setStory("");
  };

  const updateLocalUsers = (updatedUser) => {
    const all = JSON.parse(localStorage.getItem("users") || "[]");
    return all.map((u) => u.username === updatedUser.username ? updatedUser : u);
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Welcome, {user.username}</h2>

      <div>
        <h3 className="font-semibold mb-2">Add a Book</h3>
        <input className="border p-2 w-full mb-2" placeholder="Book Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="border p-2 w-full mb-2" placeholder="Thumbnail URL (optional)" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
        <button onClick={addBook} className="bg-blue-600 text-white px-4 py-2 rounded">Add Book</button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Post a Story</h3>
        <textarea className="border p-2 w-full mb-2" placeholder="Share your thoughts..." value={story} onChange={(e) => setStory(e.target.value)} />
        <button onClick={addStory} className="bg-green-600 text-white px-4 py-2 rounded">Post Story</button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Your Bookshelf</h3>
        <div className="relative w-[400px] h-[600px] mx-auto bg-cover rounded shadow-md" style={{ backgroundImage: `url(${bookshelfImg})` }}>
          {user.books.map((book, idx) => (
            <img key={book.id} src={book.thumbnail || "https://via.placeholder.com/80x100"} alt={book.title}
              className="absolute" style={{ top: 132 + (idx % 4) * 140 - 100, left: 20 + (idx % 3) * 130, width: "80px", height: "100px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
