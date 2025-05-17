// Home.jsx
import React, { useState, useEffect } from "react";
import bookshelfImg from "./assets/bookshelf.png";
import { ChatBubbleOvalLeftEllipsisIcon, GiftIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { BookOpen, ArrowsLeftRight, Gift, Megaphone } from "phosphor-react";
import { useNavigate } from "react-router-dom";

const tabGroups = [
  {
    label: "Home",
    items: ["Home"]
  },
  {
    label: "Home · Explore",
    items: ["Stories", "Shelves"]
  },
  {
    label: "My Profile",
    items: ["Add Books", "Add Reviews", "See My Shelf"]
  }
];

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const featureMap = [
  { icon: BookOpen, label: "What I’m Into", color: "border-blue-400" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?", color: "border-green-400" },
  { icon: Gift, label: "Take It, It’s Yours!", color: "border-purple-400" },
  { icon: Megaphone, label: "You Gotta Read This", color: "border-pink-400" }
];

const StoryCard = ({ user }) => {
  const story = user.stories?.[0];
  const typeMatch = featureMap.find(f => f.label === story?.type);
  const Icon = typeMatch?.icon || ChatBubbleOvalLeftEllipsisIcon;
  const borderColor = typeMatch?.color || "border-gray-700";

  const [showFull, setShowFull] = useState(false);

  return (
    <div className={`min-w-[200px] max-w-xs rounded-xl shadow p-4 border ${borderColor} hover:shadow-md transition cursor-pointer`} onClick={() => setShowFull(true)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
        <span className="font-semibold text-sm">{user.username}</span>
      </div>
      <p className="text-sm italic truncate">“{story?.text}”</p>

      {showFull && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-2">{story?.type}</h3>
            <p className="text-sm italic mb-4">{story?.text}</p>
            <div className="text-right">
              <button
                onClick={() => setShowFull(false)}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
      className="rounded-xl shadow-lg p-4 bg-gray-900 hover:shadow-xl transition cursor-pointer text-white"
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

export default function Home({ user, users, setUser }) {
  const [activeTab, setActiveTab] = useState("Home");
  const [showStoryInput, setShowStoryInput] = useState(null);
  const [storyText, setStoryText] = useState("");

  const handlePostStory = () => {
    const updated = { ...user };
    updated.stories = [{ type: showStoryInput.label, text: storyText }];
    localStorage.setItem("loggedInUser", updated.username);
    const usersList = JSON.parse(localStorage.getItem("users") || "[]").map(u =>
      u.username === updated.username ? updated : u
    );
    localStorage.setItem("users", JSON.stringify(usersList));
    setUser(updated);
    setShowStoryInput(null);
    setStoryText("");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 shadow-lg p-4 space-y-4 text-white">
        <h2 className="text-lg font-bold mb-4">🏠 Met·A·Book</h2>
        {tabGroups.map(group => (
  <div key={group.label} className="mb-4">
    <h4 className="text-xs uppercase text-gray-400 mb-2">{group.label}</h4>
    {group.items.map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`block w-full text-left px-3 py-2 rounded ${
          activeTab === tab
            ? "bg-purple-700 text-white font-semibold"
            : "hover:bg-purple-800"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === "Home" && (
          <div className="space-y-10">
            {/* Feature Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featureMap.map(feature => (
                <button
                  key={feature.label}
                  onClick={() => setShowStoryInput(feature)}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-xl shadow hover:bg-gray-700 transition"
                >
                  <feature.icon size={32} />
                  <span className="text-sm font-semibold">{feature.label}</span>
                </button>
              ))}
            </div>

            {/* Story Modal */}
            {showStoryInput && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Post a story: {showStoryInput.label}</h3>
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white resize-none"
                    rows={4}
                    placeholder="What's on your mind?"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowStoryInput(null)}
                      className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostStory}
                      className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

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
