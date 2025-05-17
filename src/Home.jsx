// Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatCircleText, BookOpen, ArrowsLeftRight, Gift, Megaphone } from "phosphor-react";
import Shelf from "./tabs/Shelf";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const featureMap = [
  { icon: BookOpen, label: "What I’m Into", color: "border-blue-400" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?", color: "border-green-400" },
  { icon: Gift, label: "Take It, It’s Yours!", color: "border-purple-400" },
  { icon: Megaphone, label: "You Gotta Read This", color: "border-pink-400" }
];

export default function Home({ users }) {
  const [showStoryInput, setShowStoryInput] = useState(null);
  const [storyText, setStoryText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      const userMatch = users.find(u => u.username === loggedInUser);
      if (userMatch) setCurrentUser(userMatch);
    }
  }, [users]);

  const handlePostStory = async () => {
    if (!currentUser || !showStoryInput) return;
    const story = { type: showStoryInput.label, text: storyText };
    const userRef = doc(db, "users", currentUser.username);
    await updateDoc(userRef, { stories: [story] });

    // Update localStorage
    const updated = { ...currentUser };
    updated.stories = [story];
    localStorage.setItem("loggedInUser", updated.username);
    const usersList = JSON.parse(localStorage.getItem("users") || "[]").map(u =>
      u.username === updated.username ? updated : u
    );
    localStorage.setItem("users", JSON.stringify(usersList));
    
    setShowStoryInput(null);
    setStoryText("");
  };

  function getRandomShelfSubset(shelves, count = 2) {
    if (!shelves || shelves.length === 0) return [];
    const shuffled = [...shelves].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  return (
    <div className="space-y-10">
      {/* Feature Cards */}
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

      {/* User Stories */}
      <div>
        <h2 className="text-xl font-bold mb-3">📢 What others are sharing</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {users.map(user => {
            const story = user.stories?.[0];
            const typeMatch = featureMap.find(f => f.label === story?.type);
            const Icon = typeMatch?.icon || ChatCircleText;
            const borderColor = typeMatch?.color || "border-gray-700";
            return (
              <div
                key={user.username}
                className={`min-w-[200px] max-w-xs rounded-xl shadow p-4 border ${borderColor} hover:shadow-md transition cursor-pointer`}
                onClick={() => alert(story?.text)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold text-sm">{user.name || user.username}</span>
                </div>
                <p className="text-sm italic truncate">“{story?.text}”</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Shelves */}
      <div>
        <h2 className="text-xl font-bold mb-3">📚 Bookshelves</h2>
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {users.map(user => (
            <div
              key={user.username}
              onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
              className="min-w-[300px] rounded-xl shadow-lg p-4 bg-gray-900 hover:shadow-xl transition cursor-pointer text-white"
            >
              {user.shelves && user.shelves.length > 0 ? 
                getRandomShelfSubset(user.shelves, 2).map(shelf => (
                  <Shelf
                    key={shelf.id}
                    books={shelf.books || []}
                    title={`${user.name || user.username}'s ${shelf.name}`}
                  />
                )) : 
                <p className="text-gray-400 italic">No shelves available</p>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
