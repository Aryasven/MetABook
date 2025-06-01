// Home_new.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChatCircleText, BookOpen, ArrowsLeftRight, Gift, 
  Megaphone, X, Books, BookmarkSimple, House, Activity
} from "phosphor-react";
import AppWalkthrough from "./components/AppWalkthrough";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";

// Import tab components
import FeedTab from "./tabs/FeedTab";
import StoriesTab from "./tabs/StoriesTab";
import ShelvesTab from "./tabs/ShelvesTab";

// Feature cards data
const featureMap = [
  { icon: BookOpen, label: "Build My Library", color: "from-blue-600 to-blue-800", lightColor: "text-blue-400" },
  { icon: Megaphone, label: "You Gotta Read This", color: "from-pink-600 to-pink-800", lightColor: "text-pink-400" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?", color: "from-green-600 to-green-800", lightColor: "text-green-400" },
  { icon: Gift, label: "Take It, It's Yours!", color: "from-purple-600 to-purple-800", lightColor: "text-purple-400" }
];

export default function Home({ users }) {
  const [showStoryInput, setShowStoryInput] = useState(null);
  const [storyText, setStoryText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedStories, setExpandedStories] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
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
      
      if (typeof window.updateUsers === 'function') {
        window.updateUsers(userData);
      }
      
      return userData;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!authUser) return;
      
      try {
        const userMatch = users.find(u => u.uid === authUser.uid);
        if (userMatch) {
          setCurrentUser(userMatch);
          return;
        }
        
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser({ uid: userSnap.id, ...userSnap.data() });
        } else {
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
  
  // Check if user has seen walkthrough
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('metabook_walkthrough_completed');
    if (!hasSeenWalkthrough && authUser) {
      // Show walkthrough for new users after a short delay
      const timer = setTimeout(() => {
        setShowWalkthrough(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authUser]);
  
  // Refresh data when tab changes
  useEffect(() => {
    if (activeTab === "shelves") {
      fetchUsersData();
    }
  }, [activeTab]);

  // Toggle story expansion
  const toggleExpandStory = (userId) => {
    setExpandedStories(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Handle posting a new story
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
      
      const userId = currentUser.uid || currentUser.username;
      if (!userId) throw new Error("User ID not found");
      
      let existingStories = [];
      const userToUpdate = users.find(u => 
        (u.uid && u.uid === userId) || (u.username && u.username === userId)
      );
      
      if (userToUpdate?.stories) existingStories = [...userToUpdate.stories];
      
      const updatedStories = [story, ...existingStories];
      const userRef = doc(db, "users", userId);
      
      if (!userToUpdate?.createdAt) {
        await updateDoc(userRef, { 
          stories: updatedStories,
          createdAt: new Date().toISOString() 
        });
      } else {
        await updateDoc(userRef, { stories: updatedStories });
      }

      const updatedUser = {
        ...(userToUpdate || currentUser),
        stories: updatedStories
      };
      
      setCurrentUser(updatedUser);
      setShowStoryInput(null);
      setStoryText("");
      
      const updatedUsers = users.map(user => {
        if ((user.uid && user.uid === userId) || (user.username && user.username === userId)) {
          return updatedUser;
        }
        return user;
      });
      
      if (typeof window.updateUsers === 'function') {
        window.updateUsers(updatedUsers);
      }
    } catch (err) {
      console.error("Error posting story:", err);
      alert("Failed to post your story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle heart reactions
  const handleHeartReaction = async (e, user, item, itemType = 'story') => {
    e.stopPropagation();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const currentUserId = currentUser.uid || currentUser.username;
      const reactions = item.reactions || { hearts: [] };
      const hasHearted = reactions.hearts.includes(currentUserId);
      const updatedHearts = hasHearted
        ? reactions.hearts.filter(id => id !== currentUserId)
        : [...reactions.hearts, currentUserId];
      
      const updatedItem = {
        ...item,
        reactions: { ...reactions, hearts: updatedHearts }
      };
      
      let updatedUsers;
      
      if (itemType === 'story') {
        const updatedStories = user.stories.map(s => 
          s.timestamp === item.timestamp ? updatedItem : s
        );
        
        const userRef = doc(db, "users", user.uid || user.username);
        await updateDoc(userRef, { stories: updatedStories });
        
        if (!hasHearted && user.uid !== currentUserId) {
          const targetUserRef = doc(db, "users", user.uid);
          const targetUserSnap = await getDoc(targetUserRef);
          
          if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data();
            const notifications = targetUserData.notifications || [];
            
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
              storyId: item.timestamp
            };
            
            await updateDoc(targetUserRef, { 
              notifications: [newNotification, ...notifications].slice(0, 50)
            });
          }
        }
        
        updatedUsers = users.map(u => {
          if ((u.uid && u.uid === user.uid) || (u.username && u.username === user.username)) {
            return { ...u, stories: updatedStories };
          }
          return u;
        });
      } else if (itemType === 'shelf') {
        const updatedShelves = user.shelves.map(s => 
          s.id === item.id ? updatedItem : s
        );
        
        const userRef = doc(db, "users", user.uid || user.username);
        await updateDoc(userRef, { shelves: updatedShelves });
        
        if (!hasHearted && user.uid !== currentUserId) {
          const targetUserRef = doc(db, "users", user.uid);
          const targetUserSnap = await getDoc(targetUserRef);
          
          if (targetUserSnap.exists()) {
            const targetUserData = targetUserSnap.data();
            const notifications = targetUserData.notifications || [];
            
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
              shelfId: item.id
            };
            
            await updateDoc(targetUserRef, { 
              notifications: [newNotification, ...notifications].slice(0, 50)
            });
          }
        }
        
        updatedUsers = users.map(u => {
          if ((u.uid && u.uid === user.uid) || (u.username && u.username === user.username)) {
            return { ...u, shelves: updatedShelves };
          }
          return u;
        });
      }
      
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
    { id: "shelves", label: "Discover", icon: BookmarkSimple },
    { id: "stories", label: "Stories", icon: ChatCircleText }
  ];
  
  // Handle navigation to shelf view
  const handleViewShelf = (userId, shelfId) => {
    navigate(`/shelf/${userId}?shelfId=${shelfId}`);
  };

  // Filter users who have actually shared stories with text content
  const usersWithStories = users.filter(user => user.stories?.[0]?.text);

  return (
    <div className="max-w-[95%] w-full mx-auto p-1 sm:p-4 md:p-6 space-y-4 -mt-2 sm:-mt-4">
      {/* Welcome Section and Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-700">
        <div className="p-3 pb-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-full">
                <Books size={24} weight="bold" />
              </div>
              <h1 className="text-xl font-bold">Welcome to MetABook</h1>
            </div>
            <button 
              onClick={() => setShowWalkthrough(true)}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded-full flex items-center gap-1 animate-pulse"
            >
              <Activity size={16} />
              App Tour
            </button>
          </div>
          
          <p className="text-gray-300 mb-3">
            Share your reading journey, discover new books, and connect with fellow readers.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {featureMap.map(feature => {
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
        
        {/* Tab Navigation */}
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
        {/* Feed Tab */}
        {activeTab === "feed" && (
          <FeedTab 
            users={users}
            currentUser={currentUser}
            handleHeartReaction={handleHeartReaction}
            setShowStoryInput={setShowStoryInput}
            featureMap={featureMap}
          />
        )}
        
        {/* Stories Tab */}
        {activeTab === "stories" && (
          <StoriesTab 
            users={users}
            currentUser={currentUser}
            handleHeartReaction={handleHeartReaction}
            setShowStoryInput={setShowStoryInput}
            featureMap={featureMap}
          />
        )}
        
        {/* Shelves Tab */}
        {activeTab === "shelves" && (
          <div className="max-h-[75vh] overflow-y-auto pr-2 hide-scrollbar">
            <ShelvesTab 
              users={users}
              onHeartReaction={handleHeartReaction}
              onViewShelf={handleViewShelf}
            />
          </div>
        )}
      </div>
      
      {/* Styling */}
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
      
      {/* App Walkthrough */}
      <AppWalkthrough 
        isOpen={showWalkthrough} 
        onClose={() => setShowWalkthrough(false)} 
        setActiveTab={setActiveTab}
      />
    </div>
  );
}