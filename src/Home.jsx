// Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChatCircleText, BookOpen, ArrowsLeftRight, Gift, 
  Megaphone, X, Users, BookmarkSimple, Books,
  House, Activity, Heart, Bell, UserPlus, BookBookmark
} from "phosphor-react";
import Shelf from "./tabs/Shelf";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";

const featureMap = [
  { icon: BookOpen, label: "Build My Library", color: "from-blue-600 to-blue-800", lightColor: "text-blue-400" },
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
        timestamp: new Date().toISOString(),
        reactions: { hearts: [] }
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
      
      // If this is a new user without a createdAt timestamp, add one
      if (!userToUpdate?.createdAt) {
        await updateDoc(userRef, { 
          stories: updatedStories,
          createdAt: new Date().toISOString() 
        });
      } else {
        await updateDoc(userRef, { stories: updatedStories });
      }

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
  
  // Handle heart reaction on a story or shelf
  const handleHeartReaction = async (e, user, item, itemType = 'story') => {
    e.stopPropagation(); // Prevent expansion when clicking heart
    
    if (!currentUser) return; // Must be logged in to react
    
    setLoading(true);
    try {
      // Get the current user ID
      const currentUserId = currentUser.uid || currentUser.username;
      
      // Check if item has reactions field, if not initialize it
      const reactions = item.reactions || { hearts: [] };
      
      // Check if user already hearted this item
      const hasHearted = reactions.hearts.includes(currentUserId);
      
      // Update the hearts array
      const updatedHearts = hasHearted
        ? reactions.hearts.filter(id => id !== currentUserId) // Remove heart
        : [...reactions.hearts, currentUserId]; // Add heart
      
      // Create updated item object
      const updatedItem = {
        ...item,
        reactions: { ...reactions, hearts: updatedHearts }
      };
      
      let updatedUsers;
      
      if (itemType === 'story') {
        // Update the story in the user's stories array
        const updatedStories = user.stories.map(s => 
          s.timestamp === item.timestamp ? updatedItem : s
        );
        
        // Update Firestore
        const userRef = doc(db, "users", user.uid || user.username);
        await updateDoc(userRef, { stories: updatedStories });
        
        // Create notification for the story owner if this is a new heart
        if (!hasHearted && user.uid !== currentUserId) {
          // Get the target user's existing notifications
          const targetUserRef = doc(db, "users", user.uid);
          const targetUserSnap = await getDoc(targetUserRef);
          
          if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data();
            const notifications = targetUserData.notifications || [];
            
            // Add new notification
            const newNotification = {
              id: `like-story-${Date.now()}`,
              type: "story_like",
              user: {
                uid: currentUserId,
                name: currentUser.name || currentUser.displayName,
                email: currentUser.email
              },
              message: "liked your story",
              timestamp: new Date().toISOString(),
              read: false,
              storyId: item.timestamp // Reference to identify which story was liked
            };
            
            // Update notifications in Firestore
            await updateDoc(targetUserRef, { 
              notifications: [newNotification, ...notifications].slice(0, 50) // Keep only the 50 most recent
            });
          }
        }
        
        // Update local state
        updatedUsers = users.map(u => {
          if ((u.uid && u.uid === user.uid) || (u.username && u.username === user.username)) {
            return { ...u, stories: updatedStories };
          }
          return u;
        });
      } else if (itemType === 'shelf') {
        // Update the shelf in the user's shelves array
        const updatedShelves = user.shelves.map(s => 
          s.id === item.id ? updatedItem : s
        );
        
        // Update Firestore
        const userRef = doc(db, "users", user.uid || user.username);
        await updateDoc(userRef, { shelves: updatedShelves });
        
        // Create notification for the shelf owner if this is a new heart
        if (!hasHearted && user.uid !== currentUserId) {
          // Get the target user's existing notifications
          const targetUserRef = doc(db, "users", user.uid);
          const targetUserSnap = await getDoc(targetUserRef);
          
          if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data();
            const notifications = targetUserData.notifications || [];
            
            // Add new notification
            const newNotification = {
              id: `like-shelf-${Date.now()}`,
              type: "shelf_like",
              user: {
                uid: currentUserId,
                name: currentUser.name || currentUser.displayName,
                email: currentUser.email
              },
              message: `liked your "${item.name}" shelf`,
              timestamp: new Date().toISOString(),
              read: false,
              shelfId: item.id // Reference to identify which shelf was liked
            };
            
            // Update notifications in Firestore
            await updateDoc(targetUserRef, { 
              notifications: [newNotification, ...notifications].slice(0, 50) // Keep only the 50 most recent
            });
          }
        }
        
        // Update local state
        updatedUsers = users.map(u => {
          if ((u.uid && u.uid === user.uid) || (u.username && u.username === user.username)) {
            return { ...u, shelves: updatedShelves };
          }
          return u;
        });
      }
      
      // Update the users state in the parent component
      if (typeof window.updateUsers === 'function' && updatedUsers) {
        window.updateUsers(updatedUsers);
      }
    } catch (err) {
      console.error("Error updating reaction:", err);
    } finally {
      setLoading(false);
    }
  };

  // Define the tabs
  const tabs = [
    { id: "feed", label: "Feed", icon: House },
    { id: "stories", label: "Stories", icon: ChatCircleText },
    { id: "shelves", label: "Shelves", icon: BookmarkSimple }
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
            {featureMap.map(feature => {
              // Check if user has any shelves with books
              const hasBooks = currentUser?.shelves?.some(shelf => shelf.books?.length > 0);
              const isLibraryFeature = feature.label === "Build My Library";
              
              return (
                <button
                  key={feature.label}
                  onClick={() => {
                    if (isLibraryFeature) {
                      navigate("/tabs/add-books");
                    } else {
                      setShowStoryInput(feature);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br ${feature.color} rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all relative
                    ${isLibraryFeature && !hasBooks ? 'animate-pulse ring-2 ring-yellow-400' : ''}`}
                >
                  <feature.icon size={28} weight="duotone" className="mb-1" />
                  <span className="text-sm font-medium text-center">{feature.label}</span>
                  {isLibraryFeature && !hasBooks && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                      New!
                    </span>
                  )}
                </button>
              );
            })}
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-start items-start z-50 p-4 pt-16">
          <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700 animate-fade-in mx-auto">
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
        {/* Feed Tab - Shows all recent activity */}
        {activeTab === "feed" && (
          <div className="space-y-8">
            {/* Recent Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={22} className="text-purple-400" />
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                </div>
                <button 
                  onClick={() => setShowStoryInput(featureMap[0])}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Share something
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
              <div className="space-y-4">
                {/* Combined activity feed with all types of updates */}
                {[
                  // Stories
                  ...usersWithStories.map(user => ({
                    type: 'story',
                    user,
                    data: user.stories[0],
                    timestamp: user.stories[0].timestamp
                  })),
                  
                  // All shelf updates - show each shelf as an activity
                  ...users.flatMap(user => {
                    if (!user.shelves) return [];
                    
                    return user.shelves.map(shelf => ({
                      type: 'shelf_update',
                      user,
                      data: shelf,
                      timestamp: shelf.updatedAt || new Date().toISOString()
                    }));
                  }),
                  
                  // New users
                  ...users.filter(user => user.createdAt)
                    .map(user => ({
                      type: 'new_user',
                      user,
                      data: null,
                      timestamp: user.createdAt
                    }))
                ]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((item, index) => {
                  if (item.type === 'story') {
                    const user = item.user;
                    const story = item.data;
                    const typeMatch = featureMap.find(f => f.label === story.type);
                    const Icon = typeMatch?.icon || ChatCircleText;
                    const colorClass = typeMatch?.lightColor || "text-gray-400";
                    
                    return (
                      <div
                        key={`story-${user.username || user.uid}-${index}`}
                        className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
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
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">
                              {story.text.length > 150 && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandStory(user.uid || user.username);
                                  }}
                                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center mr-3"
                                >
                                  {expandedStories.includes(user.uid || user.username) ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleHeartReaction(e, user, story, 'story')}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Heart 
                                size={16} 
                                weight={story.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) ? "fill" : "regular"}
                                className={story.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) 
                                  ? "text-red-500" 
                                  : "text-gray-400 hover:text-red-500"} 
                              />
                              <span className="text-gray-400">
                                {story.reactions?.hearts?.length || 0}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'shelf_update') {
                    // Shelf update
                    const user = item.user;
                    const shelf = item.data;
                    
                    return (
                      <div
                        key={`shelf-${user.username || user.uid}-${shelf.id || index}`}
                        onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                        className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-blue-700/30 p-1.5 rounded-full">
                            <BookmarkSimple size={16} className="text-blue-400" />
                          </div>
                          <div>
                            <span className="font-semibold block">{user.name || user.username}</span>
                            <span className="text-xs text-gray-400">updated their "{shelf.name}" shelf</span>
                          </div>
                        </div>
                        
                        {shelf && (
                          <div className="overflow-x-auto pb-2 hide-scrollbar">
                            <div className="space-y-4">
                              <div className="shelf-container">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">
                                  {shelf.books?.length || 0} {shelf.books?.length === 1 ? 'book' : 'books'} on this shelf
                                </h4>
                                <Shelf
                                  books={shelf.books?.slice(0, 5) || []}
                                  title={null}
                                />
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={(e) => handleHeartReaction(e, user, shelf, 'shelf')}
                                    className="flex items-center gap-1 text-xs"
                                  >
                                    <Heart 
                                      size={16} 
                                      weight={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) ? "fill" : "regular"}
                                      className={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) 
                                        ? "text-red-500" 
                                        : "text-gray-400 hover:text-red-500"} 
                                    />
                                    <span className="text-gray-400">
                                      {shelf.reactions?.hearts?.length || 0}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else if (item.type === 'new_user') {
                    // New user joined
                    const user = item.user;
                    const joinDate = new Date(item.timestamp);
                    
                    return (
                      <div
                        key={`new-user-${user.username || user.uid}-${index}`}
                        className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                        onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-green-700/30 p-1.5 rounded-full">
                            <UserPlus size={16} className="text-green-400" />
                          </div>
                          <div>
                            <span className="font-semibold block">{user.name || user.username}</span>
                            <span className="text-xs text-gray-400">joined MetABook</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">
                          Welcome our newest community member! Check out their profile.
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {joinDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  }
                })}
                
                {/* Empty state */}
                {usersWithStories.length === 0 && users.filter(user => user.shelves?.length > 0).length === 0 && (
                  <div className="flex items-center justify-center w-full py-8 text-gray-400">
                    <div className="text-center">
                      <Activity size={32} className="mx-auto mb-2 text-gray-600" />
                      <p>No recent activity to show.</p>
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
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center">
                            {story.text.length > 150 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandStory(user.uid || user.username);
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center mr-3"
                              >
                                {expandedStories.includes(user.uid || user.username) ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleHeartReaction(e, user, story)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Heart 
                              size={16} 
                              weight={story.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) ? "fill" : "regular"}
                              className={story.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) 
                                ? "text-red-500" 
                                : "text-gray-400 hover:text-red-500"} 
                            />
                            <span className="text-gray-400">
                              {story.reactions?.hearts?.length || 0}
                            </span>
                          </button>
                        </div>
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
        
        {/* Shelves Tab - Responsive grid layout with vertical scrolling */}
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
            
            {/* Vertical scrolling with responsive grid */}
            <div className="max-h-[75vh] overflow-y-auto pr-2 hide-scrollbar">
              {users.filter(user => user.shelves?.some(shelf => shelf.books?.length > 0)).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.filter(user => user.shelves?.some(shelf => shelf.books?.length > 0)).map(user => {
                    // Filter out empty shelves
                    const nonEmptyShelves = user.shelves.filter(shelf => shelf.books?.length > 0);
                    
                    return (
                      <div
                        key={user.username || user.uid}
                        onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
                        className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer h-full"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Users size={18} className="text-purple-400" />
                          <span className="font-semibold">{user.name || user.username}'s Shelves</span>
                        </div>
                        
                        <div className="space-y-6 w-full overflow-hidden">
                          {nonEmptyShelves.map(shelf => (
                            <div key={shelf.id} className="shelf-container w-full">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">{shelf.name}</h4>
                              <div className="w-full overflow-x-auto">
                                <Shelf
                                  books={shelf.books || []}
                                  title={null} // We already show the title above
                                />
                              </div>
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={(e) => handleHeartReaction(e, user, shelf, 'shelf')}
                                  className="flex items-center gap-1 text-xs"
                                >
                                  <Heart 
                                    size={16} 
                                    weight={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) ? "fill" : "regular"}
                                    className={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) 
                                      ? "text-red-500" 
                                      : "text-gray-400 hover:text-red-500"} 
                                  />
                                  <span className="text-gray-400">
                                    {shelf.reactions?.hearts?.length || 0}
                                  </span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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