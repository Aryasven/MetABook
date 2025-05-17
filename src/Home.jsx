// Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChatCircleText, BookOpen, ArrowsLeftRight, Gift, 
  Megaphone, X, Users, BookmarkSimple, Books
} from "phosphor-react";
import Shelf from "./tabs/Shelf";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";

const featureMap = [
  { icon: BookOpen, label: "What I'm Into", color: "from-blue-600 to-blue-800", lightColor: "text-blue-400" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?", color: "from-green-600 to-green-800", lightColor: "text-green-400" },
  { icon: Gift, label: "Take It, It's Yours!", color: "from-purple-600 to-purple-800", lightColor: "text-purple-400" },
  { icon: Megaphone, label: "You Gotta Read This", color: "from-pink-600 to-pink-800", lightColor: "text-pink-400" }
];

export default function Home({ users }) {
  const [showStoryInput, setShowStoryInput] = useState(null);
  const [storyText, setStoryText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuth();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!authUser) return;
      
      try {
        const userDoc = doc(db, "users", authUser.uid);
        const userSnap = await getDocs(userDoc);
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data());
        } else {
          // Try to find by username from localStorage (legacy support)
          const loggedInUser = localStorage.getItem("loggedInUser");
          if (loggedInUser) {
            const userMatch = users.find(u => u.username === loggedInUser);
            if (userMatch) setCurrentUser(userMatch);
          }
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
  }, [users, authUser]);

  const handlePostStory = async () => {
    if (!currentUser || !showStoryInput || !storyText.trim()) return;
    
    setLoading(true);
    try {
      const story = { 
        type: showStoryInput.label, 
        text: storyText,
        timestamp: new Date().toISOString()
      };
      
      const userRef = doc(db, "users", currentUser.uid || currentUser.username);
      await updateDoc(userRef, { stories: [story] });

      // Update local state
      setShowStoryInput(null);
      setStoryText("");
      
      // Force refresh to show the new story
      window.location.reload();
    } catch (err) {
      console.error("Error posting story:", err);
      alert("Failed to post your story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // We no longer need this function as we're showing all shelves
  // function getRandomShelfSubset(shelves, count = 2) {
  //   if (!shelves || shelves.length === 0) return [];
  //   const shuffled = [...shelves].sort(() => 0.5 - Math.random());
  //   return shuffled.slice(0, count);
  // }

  // Filter users who have actually shared stories with text content
  const usersWithStories = users.filter(user => user.stories?.[0]?.text);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-purple-600 p-3 rounded-full">
            <Books size={24} weight="bold" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to MetABook</h1>
        </div>
        
        <p className="text-gray-300 mb-6">
          Share your reading journey, discover new books, and connect with fellow readers.
        </p>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featureMap.map(feature => (
            <button
              key={feature.label}
              onClick={() => setShowStoryInput(feature)}
              className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
            >
              <feature.icon size={32} weight="duotone" />
              <span className="text-sm font-semibold">{feature.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Modal */}
      {showStoryInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <showStoryInput.icon size={24} className={showStoryInput.lightColor} />
                {showStoryInput.label}
              </h3>
              <button 
                onClick={() => setShowStoryInput(null)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={5}
              placeholder="Share your thoughts with the community..."
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowStoryInput(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePostStory}
                disabled={loading || !storyText.trim()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  loading || !storyText.trim() 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>Post</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Stories Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChatCircleText size={22} className="text-purple-400" />
            <h2 className="text-xl font-bold">Community Stories</h2>
          </div>
          <button 
            onClick={() => setShowStoryInput(featureMap[0])}
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Share your story
          </button>
        </div>
        
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-4 min-w-max">
            {usersWithStories.length > 0 ? (
              usersWithStories.map(user => {
                const story = user.stories[0];
                const typeMatch = featureMap.find(f => f.label === story.type);
                const Icon = typeMatch?.icon || ChatCircleText;
                const colorClass = typeMatch?.lightColor || "text-gray-400";
                
                return (
                  <div
                    key={user.username || user.uid}
                    className="min-w-[280px] max-w-xs rounded-xl shadow-lg p-5 bg-gray-800 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                    onClick={() => alert(story.text)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gray-700 p-2 rounded-full">
                        <Icon size={18} className={colorClass} />
                      </div>
                      <div>
                        <span className="font-semibold block">{user.name || user.username}</span>
                        <span className="text-xs text-gray-400">{typeMatch?.label || "Shared a story"}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 line-clamp-3">"{story.text}"</p>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center w-full py-8 text-gray-400">
                <div className="text-center">
                  <ChatCircleText size={32} className="mx-auto mb-2 text-gray-600" />
                  <p>No stories shared yet.</p>
                  <button
                    onClick={() => setShowStoryInput(featureMap[0])}
                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Be the first to share!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Shelves Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookmarkSimple size={22} className="text-purple-400" />
            <h2 className="text-xl font-bold">Community Bookshelves</h2>
          </div>
          <button 
            onClick={() => navigate("/tabs/add-books")}
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Manage your shelves
          </button>
        </div>
        
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-6 min-w-max">
            {users.filter(user => user.shelves?.length > 0).length > 0 ? (
              users.filter(user => user.shelves?.length > 0).map(user => (
                <div
                  key={user.username || user.uid}
                  onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                  className="min-w-[450px] max-w-[500px] rounded-xl shadow-lg p-4 bg-gray-800 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={18} className="text-purple-400" />
                    <span className="font-semibold">{user.name || user.username}'s Shelves</span>
                  </div>
                  
                  {user.shelves && user.shelves.length > 0 ? (
                    <div className="max-h-[550px] overflow-y-auto pr-2 hide-scrollbar">
                      <div className="space-y-8">
                        {user.shelves.map(shelf => (
                          <Shelf
                            key={shelf.id}
                            books={shelf.books || []}
                            title={shelf.name}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No shelves available</p>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full py-8 text-gray-400">
                <div className="text-center">
                  <BookmarkSimple size={32} className="mx-auto mb-2 text-gray-600" />
                  <p>No bookshelves available yet.</p>
                  <button
                    onClick={() => navigate("/tabs/add-books")}
                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Create your bookshelf
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS for hiding scrollbars but keeping functionality */}
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}