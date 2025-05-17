import React, { useState } from "react";
import AddBooks from "./tabs/AddBooksTab";
// import AddReviewsTab from "./tabs/AddReviewsTab";
import SeeMyShelf from "./tabs/SeeMyShelfTab";
// import MyReviewsTab from "./tabs/MyReviewsTab";

const tabs = [
  "Add Books",
  "Add Reviews",
  "See My Shelf",
  "See My Reviews"
];

export default function Profile({ user, setUser }) {
  const [activeTab, setActiveTab] = useState("Add Books");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 space-y-4">
        <h2 className="text-lg font-bold mb-4">📚 My Profile</h2>
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
        {activeTab === "Add Books" &&
          <AddBooks refreshTrigger={activeTab}/> &&
          (
          <AddBooks user={user} setUser={setUser} />
        )}
        {activeTab === "See My Shelf" && (
          <SeeMyShelf user={user} setUser={setUser} />
        )}
      </div>
    </div>
  );
}
