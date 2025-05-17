// Home.jsx
import React, { useState, useEffect } from "react";
import bookshelfImg from "./assets/bookshelf.png";
import { ChatBubbleOvalLeftEllipsisIcon, GiftIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

const tabs = [
  "Home",
  "Add Books",
  "Add Reviews",
  "See My Shelf",
  "See My Reviews"
];

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const StoryCard = ({ user }) => {
  const type = user.stories[0]?.type;
  const iconMap = {
    review: ChatBubbleOvalLeftEllipsisIcon,
    giveaway: GiftIcon,
    swap: ArrowsRightLeftIcon
  };
  const Icon = iconMap[type] || ChatBubbleOvalLeftEllipsisIcon;
  const colorMap = {
    review: "bg-blue-100 text-blue-700",
    giveaway: "bg-purple-100 text-purple-700",
    swap: "bg-green-100 text-green-700"
  };
  const colorClass = colorMap[type] || "bg-gray-100 text-gray-700";

  return (
    <div className={`min-w-[200px] max-w-xs rounded-xl shadow p-4 ${colorClass} hover:shadow-md transition`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
        <span className="font-semibold text-sm">{user.username}</span>
      </div>
      <p className="text-sm italic">“{user.stories[0]?.text}”</p>
    </div>
  );
};

const BookshelfCard = ({ user }) => {
  const [booksWithCovers, setBooksWithCovers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThumbnails = async () => {
      const results = await Promise.all((user.books || []).map(async (book) => {
        if (book.thumbnail) return book;
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(book.title)}`);
        const data = await res.json();
        const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        return { ...book, thumbnail: thumb || "" };
      }));
      setBooksWithCovers(results);
    };
    fetchThumbnails();
  }, [user.books]);

  return (
    <div
      onClick={() => navigate(`/shelf/${user.username}`)}
      className="rounded-xl shadow-lg p-4 bg-white hover:shadow-xl transition cursor-pointer"
    >
      <h3 className="text-center font-semibold text-lg mb-2">{user.username}'s Shelf</h3>
      <div className="relative w-[400px] h-[600px] mx-auto bg-cover rounded" style={{ backgroundImage: `url(${bookshelfImg})` }}>
        {booksWithCovers.map((book, idx) => {
          const shelf = Math.floor(idx / 3) % ShelfY.length;
          const posX = shelfLefts[idx % 3];
          return (
            <img
              key={book.id}
              src={book.thumbnail}
              alt={book.title}
              className="absolute hover:scale-110 transition"
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
  );
};

export default function Home({ user, users }) {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 space-y-4">
        <h2 className="text-lg font-bold mb-4">🏠 Met·A·Book</h2>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`block w-full text-left px-3 py-2 rounded ${
              activeTab === tab
                ? "bg-purple-600 text-white font-semibold"
                : "hover:bg-purple-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === "Home" && (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-bold mb-3">📢 What others are sharing</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {users.map((user) => (
                  <StoryCard key={user.username} user={user} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">📚 Bookshelves</h2>
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {users.map((user) => (
                  <BookshelfCard key={user.username} user={user} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
