// ShelfView.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BookmarkSimple, User, Heart, Books, ArrowLeft, 
  ChatCircleText, UserPlus, UserMinus, Share
} from "phosphor-react";
import { useAuth } from "../useAuth";
import Shelf from "./Shelf";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import RecommendationRequest from "./RecommendationRequest";

export default function ShelfView({ users }) {
  const [shelf, setShelf] = useState(null);
  const [shelfOwner, setShelfOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.search);
  const shelfId = params.get("shelfId");
  const userId = location.pathname.split("/").pop();
  const showRecommend = params.get("recommend") === "true";
  
  // Fetch shelf and owner data
  useEffect(() => {
    const fetchShelfData = async () => {
      if (!userId || !users.length) return;
      
      // Find the shelf owner
      const owner = users.find(u => u.uid === userId || u.username === userId);
      if (!owner) return;
      
      setShelfOwner(owner);
      
      // Find the specific shelf if shelfId is provided
      if (shelfId && owner.shelves) {
        const foundShelf = owner.shelves.find(s => s.id === shelfId);
        if (foundShelf) {
          setShelf({
            ...foundShelf,
            user: {
              uid: owner.uid,
              username: owner.username,
              name: owner.name || owner.username,
              email: owner.email
            },
            displayName: `${owner.name || owner.username}'s ${foundShelf.name}`
          });
        }
      } else if (owner.shelves && owner.shelves.length > 0) {
        // Default to first shelf if no specific shelf requested
        const defaultShelf = owner.shelves[0];
        setShelf({
          ...defaultShelf,
          user: {
            uid: owner.uid,
            username: owner.username,
            name: owner.name || owner.username,
            email: owner.email
          },
          displayName: `${owner.name || owner.username}'s ${defaultShelf.name}`
        });
      }
      
      // Check if current user is following this user
      if (currentUser && owner.followers) {
        setIsFollowing(owner.followers.includes(currentUser.uid || currentUser.username));
      }
    };
    
    fetchShelfData();
  }, [userId, shelfId, users, currentUser]);
  
  // Show recommendation modal if URL parameter is set
  useEffect(() => {
    if (showRecommend && shelf && shelfOwner) {
      setShowRecommendModal(true);
    }
  }, [showRecommend, shelf, shelfOwner]);
  
  // Handle heart reaction
  const handleHeartReaction = async (e) => {
    e.stopPropagation();
    if (!currentUser || !shelf) return;
    
    setLoading(true);
    try {
      const currentUserId = currentUser.uid || currentUser.username;
      
      // Check if item has reactions field, if not initialize it
      const reactions = shelf.reactions || { hearts: [] };
      
      // Check if user already hearted this item
      const hasHearted = reactions.hearts.includes(currentUserId);
      
      // Update the hearts array
      const updatedHearts = hasHearted
        ? reactions.hearts.filter(id => id !== currentUserId) // Remove heart
        : [...reactions.hearts, currentUserId]; // Add heart
      
      // Create updated shelf object
      const updatedShelf = {
        ...shelf,
        reactions: { ...reactions, hearts: updatedHearts }
      };
      
      if (shelfOwner) {
        // Update the shelf in the user's shelves array
        const updatedShelves = shelfOwner.shelves.map(s => 
          s.id === shelf.id ? { ...s, reactions: { ...reactions, hearts: updatedHearts } } : s
        );
        
        // Update Firestore
        const userRef = doc(db, "users", shelfOwner.uid || shelfOwner.username);
        await updateDoc(userRef, { shelves: updatedShelves });
        
        // Create notification for the shelf owner if this is a new heart
        if (!hasHearted && shelfOwner.uid !== currentUserId) {
          // Get the target user's existing notifications
          const targetUserRef = doc(db, "users", shelfOwner.uid);
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
              message: `liked your "${shelf.name}" shelf`,
              timestamp: new Date().toISOString(),
              read: false,
              shelfId: shelf.id // Reference to identify which shelf was liked
            };
            
            // Update notifications in Firestore
            await updateDoc(targetUserRef, { 
              notifications: [newNotification, ...notifications].slice(0, 50) // Keep only the 50 most recent
            });
          }
        }
        
        // Update local state
        setShelf(updatedShelf);
        
        // Update local state if window.updateUsers is available
        const updatedUsers = users.map(u => {
          if ((u.uid && u.uid === shelfOwner.uid) || (u.username && u.username === shelfOwner.username)) {
            return { ...u, shelves: updatedShelves };
          }
          return u;
        });
        
        if (typeof window.updateUsers === 'function') {
          window.updateUsers(updatedUsers);
        }
      }
    } catch (err) {
      console.error("Error updating shelf reaction:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || !shelfOwner) return;
    
    setLoading(true);
    try {
      const currentUserId = currentUser.uid || currentUser.username;
      
      // Get current followers list
      const followers = shelfOwner.followers || [];
      
      // Update followers list
      const updatedFollowers = isFollowing
        ? followers.filter(id => id !== currentUserId) // Unfollow
        : [...followers, currentUserId]; // Follow
      
      // Update Firestore
      const userRef = doc(db, "users", shelfOwner.uid || shelfOwner.username);
      await updateDoc(userRef, { followers: updatedFollowers });
      
      // Create notification for the shelf owner if this is a new follow
      if (!isFollowing && shelfOwner.uid !== currentUserId) {
        // Get the target user's existing notifications
        const targetUserRef = doc(db, "users", shelfOwner.uid);
        const targetUserSnap = await getDoc(targetUserRef);
        
        if (targetUserSnap.exists()) {
          const targetUserData = targetUserSnap.data();
          const notifications = targetUserData.notifications || [];
          
          // Add new notification
          const newNotification = {
            id: `follow-${Date.now()}`,
            type: "follow",
            user: {
              uid: currentUserId,
              name: currentUser.name || currentUser.displayName,
              email: currentUser.email
            },
            message: "started following you",
            timestamp: new Date().toISOString(),
            read: false
          };
          
          // Update notifications in Firestore
          await updateDoc(targetUserRef, { 
            notifications: [newNotification, ...notifications].slice(0, 50) // Keep only the 50 most recent
          });
        }
      }
      
      // Update local state
      setIsFollowing(!isFollowing);
      
      // Update local state if window.updateUsers is available
      const updatedUsers = users.map(u => {
        if ((u.uid && u.uid === shelfOwner.uid) || (u.username && u.username === shelfOwner.username)) {
          return { ...u, followers: updatedFollowers };
        }
        return u;
      });
      
      if (typeof window.updateUsers === 'function') {
        window.updateUsers(updatedUsers);
      }
    } catch (err) {
      console.error("Error updating follow status:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle share
  const handleShare = () => {
    if (!shelf) return;
    
    // Create share URL
    const shareUrl = `${window.location.origin}/shelf/${shelfOwner.uid}?shelfId=${shelf.id}`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `${shelf.displayName} on MetABook`,
        text: `Check out ${shelf.displayName} on MetABook!`,
        url: shareUrl
      }).catch(err => {
        console.error("Error sharing:", err);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  };
  
  // Helper function to copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Link copied to clipboard!");
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  };
  
  // Loading state
  if (!shelf || !shelfOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      
      {/* Shelf header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600/20 p-2.5 rounded-full">
                <BookmarkSimple size={24} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{shelf.displayName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <User size={14} />
                    <span>{shelfOwner.name || shelfOwner.username}</span>
                  </div>
                  {shelf.genre && shelf.genre !== "general" && (
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                      {shelf.genre.charAt(0).toUpperCase() + shelf.genre.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Follow button (only show if not the shelf owner) */}
              {currentUser && currentUser.uid !== shelfOwner.uid && (
                <button
                  onClick={handleFollowToggle}
                  disabled={loading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isFollowing
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={16} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              )}
              
              {/* Share button */}
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Share shelf"
              >
                <Share size={16} className="text-gray-300" />
              </button>
              
              {/* Heart button */}
              <button 
                onClick={handleHeartReaction}
                className="flex items-center gap-1 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                disabled={loading}
                title="Like shelf"
              >
                <Heart 
                  size={16} 
                  weight={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) ? "fill" : "regular"}
                  className={shelf.reactions?.hearts?.includes(currentUser?.uid || currentUser?.username) 
                    ? "text-red-500" 
                    : "text-gray-300"} 
                />
                <span className="text-gray-300">
                  {shelf.reactions?.hearts?.length || 0}
                </span>
              </button>
              
              {/* Ask for recommendation button (only show if not the shelf owner) */}
              {currentUser && currentUser.uid !== shelfOwner.uid && (
                <button
                  onClick={() => setShowRecommendModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
                >
                  <ChatCircleText size={16} />
                  Ask for Recommendations
                </button>
              )}
            </div>
          </div>
          
          {/* Shelf description */}
          {shelf.description && (
            <p className="text-gray-300 mt-3">{shelf.description}</p>
          )}
        </div>
        
        {/* Books */}
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Books size={18} className="text-purple-400" />
            {shelf.books?.length || 0} {shelf.books?.length === 1 ? 'Book' : 'Books'} on this Shelf
          </h2>
          
          <Shelf
            books={shelf.books || []}
            title={null}
            compact={false}
          />
        </div>
      </div>
      
      {/* Recommendation Request Modal */}
      <RecommendationRequest
        isOpen={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
        shelfOwner={shelfOwner}
        shelfId={shelf.id}
        shelfName={shelf.name}
        currentUser={currentUser}
      />
    </div>
  );
}