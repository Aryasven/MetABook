// Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChatCircleText, BookOpen, ArrowsLeftRight, Gift, 
  Megaphone, X, Users, BookmarkSimple, Books,
  House, Activity
} from "phosphor-react";
import Shelf from "./tabs/Shelf";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
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
  const [expandedStories, setExpandedStories] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuth();

  // Function to fetch users data from Firestore
  const fetchUsersData = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const userData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      // Update the global users state if available
      if (typeof window.updateUsers === 'function') {
        window.updateUsers(userData);
      }
      
      return userData;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!authUser) return;
      
      try {
        // Find the current user from the users array first (most efficient)
        const userMatch = users.find(u => u.uid === authUser.uid);
        if (userMatch) {
          setCurrentUser(userMatch);
          return;
        }
        
        // If not found in users array, try to get from Firestore directly
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser({ uid: userSnap.id, ...userSnap.data() });
        } else {
          // Legacy support for username-based auth
          const loggedInUser = localStorage.getItem("loggedInUser");
          if (loggedInUser) {
            const legacyUserMatch = users.find(u => u.username === loggedInUser);
            if (legacyUserMatch) setCurrentUser(legacyUserMatch);
          }
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
  }, [users, authUser]);
  
  // Refresh data when tab changes to ensure we have the latest data
  useEffect(() => {
    if (activeTab === "shelves") {
      fetchUsersData();
    }
  }, [activeTab]);

  const handlePostStory = async () => {
    if (!currentUser || !showStoryInput || !storyText.trim()) return;
    
    setLoading(true);
    try {
      const story = { 
        type: showStoryInput.label, 
        text: storyText,
        timestamp: new Date().toISOString()
      };
      
      // Get the user ID to use for Firestore
      const userId = currentUser.uid || currentUser.username;
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Get existing stories if any
      let existingStories = [];
      const userToUpdate = users.find(u => 
        (u.uid && u.uid === userId) || (u.username && u.username === userId)
      );
      
      if (userToUpdate && userToUpdate.stories) {
        existingStories = [...userToUpdate.stories];
      }
      
      // Add new story to the beginning of the array
      const updatedStories = [story, ...existingStories];
      
      // Update Firestore
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { stories: updatedStories });

      // Create a local copy of the updated user data
      const updatedUser = {
        ...(userToUpdate || currentUser),
        stories: updatedStories
      };
      
      // Update local state immediately
      setCurrentUser(updatedUser);
      setShowStoryInput(null);
      setStoryText("");
      
      // Update the users array to include the new story
      const updatedUsers = users.map(user => {
        if ((user.uid && user.uid === userId) || 
            (user.username && user.username === userId)) {
          return updatedUser;
        }
        return user;
      });
      
      // Update the users state in the parent component
      if (typeof window.updateUsers === 'function') {
        window.updateUsers(updatedUsers);
      } else {
        console.warn("window.updateUsers function not available");
      }
    } catch (err) {
      console.error("Error posting story:", err);
      alert("Failed to post your story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter users who have actually shared stories with text content
  const usersWithStories = users.filter(user => user.stories?.[0]?.text);
  
  // For debugging
  console.log("Current users with stories:", usersWithStories.length);
  
  // Toggle story expansion
  const toggleExpandStory = (userId) => {
    setExpandedStories(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Define the tabs
  const tabs = [
    { id: "feed", label: "Feed", icon: House },
    { id: "stories", label: "Stories", icon: ChatCircleText },
    { id: "shelves", label: "Shelves", icon: BookmarkSimple },
    { id: "activity", label: "Activity", icon: Activity }
  ];

  return (
    <div className="max-w-[95%] w-full mx-auto p-1 sm:p-4 md:p-6 space-y-4 -mt-2 sm:-mt-4">
      {/* Combined Welcome Section and Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-700">
        <div className="p-3 pb-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-600 p-2 rounded-full">
              <Books size={24} weight="bold" />
            </div>
            <h1 className="text-xl font-bold">Welcome to MetABook</h1>
          </div>
          
          <p className="text-gray-300 mb-3">
            Share your reading journey, discover new books, and connect with fellow readers.
          </p>
          
          {/* Feature Cards - Better sized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {featureMap.map(feature => (
              <button
                key={feature.label}
                onClick={() => {
                  if (feature.label === "What I'm Into") {
                    navigate("/tabs/add-books");
                  } else {
                    setShowStoryInput(feature);
                  }
                }}
                className={`flex items-center gap-2 p-3 bg-gradient-to-br ${feature.color} rounded-lg shadow hover:shadow-lg transition-all`}
              >
                <feature.icon size={24} weight="duotone" />
                <span className="text-sm font-medium">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Navigation - Directly below welcome section */}
        <div className="border-t border-gray-700 p-1">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story Modal */}
      {showStoryInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700 animate-fade-in">
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
              className="w-full p-4 rounded-lg bg-gray-800/90 border border-gray-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={5}
              placeholder={
                showStoryInput.label === "Wanna Swap?" 
                  ? "Describe the book you want to swap and what you're looking for in return..."
                : showStoryInput.label === "Take It, It's Yours!" 
                  ? "Tell the community which books you're giving away and how to claim them..."
                : "Share your thoughts with the community..."
              }
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

      {/* Tab Content */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-lg">
        {/* Feed Tab - Shows all content */}
        {activeTab === "feed" && (
          <div className="space-y-8">
            {/* Stories Section */}
            <div>
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
                    usersWithStories.slice(0, 3).map(user => {
                      const story = user.stories[0];
                      const typeMatch = featureMap.find(f => f.label === story.type);
                      const Icon = typeMatch?.icon || ChatCircleText;
                      const colorClass = typeMatch?.lightColor || "text-gray-400";
                      
                      return (
                        <div
                          key={user.username || user.uid}
                          className="min-w-[380px] max-w-md rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                          onClick={() => toggleExpandStory(user.uid || user.username)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-gray-700 p-1.5 rounded-full">
                              <Icon size={16} className={colorClass} />
                            </div>
                            <div>
                              <span className="font-semibold block">{user.name || user.username}</span>
                              <span className="text-xs text-gray-400">{typeMatch?.label || "Shared a story"}</span>
                            </div>
                          </div>
                          <div className="relative min-h-[80px]">
                            <p className={`text-gray-300 ${expandedStories.includes(user.uid || user.username) ? '' : 'line-clamp-4'}`}>"{story.text}"</p>
                            {story.text.length > 150 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandStory(user.uid || user.username);
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center"
                              >
                                {expandedStories.includes(user.uid || user.username) ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
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
                  {usersWithStories.length > 3 && (
                    <div className="flex items-center justify-center min-w-[100px]">
                      <button 
                        onClick={() => setActiveTab("stories")}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        View all →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Shelves Section */}
            <div>
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
              
              <div className="overflow-x-auto pb-1 sm:pb-2 -mx-1 hide-scrollbar">
                <div className="flex space-x-2 sm:space-x-6 min-w-max">
                  {users.filter(user => user.shelves?.length > 0).length > 0 ? (
                    users.filter(user => user.shelves?.length > 0).slice(0, 2).map(user => (
                      <div
                        key={user.username || user.uid}
                        onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                        className="inline-block rounded-xl shadow-lg p-1 sm:p-4 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Users size={18} className="text-purple-400" />
                          <span className="font-semibold">{user.name || user.username}'s Shelves</span>
                        </div>
                        
                        {user.shelves && user.shelves.length > 0 ? (
                          <div className="space-y-6 md:space-y-8">
                            {user.shelves.map(shelf => (
                              <div key={shelf.id} className="shelf-container">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">{shelf.name}</h4>
                                <Shelf
                                  books={shelf.books || []}
                                  title={null} // We already show the title above
                                />
                              </div>
                            ))}
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
                  {users.filter(user => user.shelves?.length > 0).length > 2 && (
                    <div className="flex items-center justify-center min-w-[100px]">
                      <button 
                        onClick={() => setActiveTab("shelves")}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        View all →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stories Tab - Vertical scrolling list of all stories */}
        {activeTab === "stories" && (
          <div>
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
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
              {usersWithStories.length > 0 ? (
                usersWithStories.map(user => {
                  const story = user.stories[0];
                  const typeMatch = featureMap.find(f => f.label === story.type);
                  const Icon = typeMatch?.icon || ChatCircleText;
                  const colorClass = typeMatch?.lightColor || "text-gray-400";
                  
                  return (
                    <div
                      key={user.username || user.uid}
                      className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer max-w-2xl w-full"
                      onClick={() => toggleExpandStory(user.uid || user.username)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gray-700 p-1.5 rounded-full">
                          <Icon size={16} className={colorClass} />
                        </div>
                        <div>
                          <span className="font-semibold block">{user.name || user.username}</span>
                          <span className="text-xs text-gray-400">{typeMatch?.label || "Shared a story"}</span>
                        </div>
                      </div>
                      <div className="relative min-h-[120px]">
                        <p className={`text-gray-300 ${expandedStories.includes(user.uid || user.username) ? '' : 'line-clamp-6'}`}>"{story.text}"</p>
                        {story.text.length > 150 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandStory(user.uid || user.username);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center"
                          >
                            {expandedStories.includes(user.uid || user.username) ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
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
        )}
        
        {/* Shelves Tab - Responsive scrolling for shelves */}
        {activeTab === "shelves" && (
          <div>
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
            
            {/* Desktop: horizontal scrolling, Mobile: vertical scrolling */}
            <div className="max-h-[75vh] overflow-y-auto md:overflow-y-hidden md:overflow-x-auto pr-2 hide-scrollbar">
              <div className="md:flex md:space-x-6 space-y-4 md:space-y-0">
                {users.filter(user => user.shelves?.length > 0).length > 0 ? (
                  users.filter(user => user.shelves?.length > 0).map(user => (
                    <div
                      key={user.username || user.uid}
                      onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                      className="inline-block rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-purple-400" />
                        <span className="font-semibold">{user.name || user.username}'s Shelves</span>
                      </div>
                      
                      {user.shelves && user.shelves.length > 0 ? (
                        <div className="space-y-6">
                          {user.shelves.map(shelf => (
                            <div key={shelf.id} className="shelf-container">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">{shelf.name}</h4>
                              <Shelf
                                books={shelf.books || []}
                                title={null} // We already show the title above
                              />
                            </div>
                          ))}
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
        )}
        
        {/* Activity Tab - Recent activity */}
        {activeTab === "activity" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={22} className="text-purple-400" />
                <h2 className="text-xl font-bold">Recent Activity</h2>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-full py-12 text-gray-400">
              <div className="text-center">
                <Activity size={32} className="mx-auto mb-2 text-gray-600" />
                <p>Activity feed coming soon!</p>
                <p className="text-sm mt-2">Track your friends' reading progress and interactions.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add CSS classes for styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 640px) {
            .shelf-container .relative {
              margin-bottom: -0.5rem;
            }
          }
          
          .hide-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `
      }} />
    </div>
  );
}