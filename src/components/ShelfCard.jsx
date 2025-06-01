// ShelfCard.jsx
import React, { useState } from 'react';
import { User, Heart, ChatCircleText, UserPlus } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import Shelf from '../tabs/Shelf';
import RecommendationRequest from '../tabs/RecommendationRequest';

export default function ShelfCard({ 
  shelf, 
  shelfOwner, 
  currentUser, 
  onHeartReaction, 
  loading = false,
  compact = false,
  showHeader = true,
  showFooter = true,
  hideHeaderButtons = false
}) {
  const [recommendationModal, setRecommendationModal] = useState({
    isOpen: false,
    shelfOwner: null,
    shelfId: null,
    shelfName: ""
  });
  const navigate = useNavigate();

  // Handle heart reaction
  const handleHeartClick = (e) => {
    e.stopPropagation();
    if (onHeartReaction) {
      onHeartReaction(e, shelfOwner, shelf, 'shelf');
    }
  };
  
  // Handle follow user
  const handleFollowUser = async (e) => {
    e.stopPropagation();
    if (!currentUser || currentUser.uid === shelfOwner.uid) return;
    
    try {
      // Check if already following
      const currentUserRef = doc(db, "users", currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data();
      
      const following = currentUserData.following || [];
      const isFollowing = following.some(f => f.uid === shelfOwner.uid);
      
      if (isFollowing) {
        // Unfollow
        const updatedFollowing = following.filter(f => f.uid !== shelfOwner.uid);
        await updateDoc(currentUserRef, { following: updatedFollowing });
        alert(`You are no longer following ${shelfOwner.name || shelfOwner.username}`);
      } else {
        // Follow
        const newFollowing = [
          ...following, 
          { 
            uid: shelfOwner.uid, 
            name: shelfOwner.name || shelfOwner.username,
            timestamp: new Date().toISOString()
          }
        ];
        await updateDoc(currentUserRef, { following: newFollowing });
        
        // Add notification for the user being followed
        const targetUserRef = doc(db, "users", shelfOwner.uid);
        const targetUserSnap = await getDoc(targetUserRef);
        
        if (targetUserSnap.exists()) {
          const targetUserData = targetUserSnap.data();
          const notifications = targetUserData.notifications || [];
          
          const newNotification = {
            id: `follow-${Date.now()}`,
            type: "new_follower",
            user: {
              uid: currentUser.uid,
              name: currentUser.name || currentUser.displayName,
              email: currentUser.email
            },
            message: "started following you",
            timestamp: new Date().toISOString(),
            read: false
          };
          
          await updateDoc(targetUserRef, { 
            notifications: [newNotification, ...notifications].slice(0, 50)
          });
        }
        
        alert(`You are now following ${shelfOwner.name || shelfOwner.username}. You'll be notified when they add new books!`);
      }
    } catch (err) {
      console.error("Error updating follow status:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Handle recommendation request
  const handleRecommendationClick = (e) => {
    e.stopPropagation();
    setRecommendationModal({
      isOpen: true,
      shelfOwner,
      shelfId: shelf.id,
      shelfName: shelf.name
    });
  };

  // Handle shelf click
  const handleShelfClick = () => {
    navigate(`/shelf/${shelfOwner.uid}?shelfId=${shelf.id}`);
  };

  return (
    <>
      <div 
        className={`bg-gray-800 rounded-xl border ${shelf.featured ? 'border-yellow-500/30' : 'border-gray-700'} overflow-hidden hover:border-purple-500 cursor-pointer transition-all`}
        onClick={handleShelfClick}
      >
        {/* Shelf header */}
        {showHeader && (
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${shelf.featured ? 'bg-yellow-500/20' : 'bg-gray-700'} p-1.5 rounded-full`}>
                <User size={16} className={shelf.featured ? "text-yellow-400" : "text-purple-400"} />
              </div>
              <div>
                <span className="font-medium text-sm">{shelf.displayName || `${shelfOwner.name || shelfOwner.username}'s ${shelf.name}`}</span>
                {shelf.genre && shelf.genre !== "general" && (
                  <span className="text-xs text-gray-400 block">{shelf.genre.charAt(0).toUpperCase() + shelf.genre.slice(1)}</span>
                )}
              </div>
            </div>
            
            {!hideHeaderButtons && (
              <div className="flex items-center gap-2">
                {currentUser && currentUser.uid !== shelfOwner.uid && (
                  <>
                    <button 
                      onClick={handleFollowUser}
                      className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="Follow user"
                    >
                      <UserPlus size={14} className="text-green-400" />
                    </button>
                    <button 
                      onClick={handleRecommendationClick}
                      className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="Ask for recommendation"
                    >
                      <ChatCircleText size={14} className="text-blue-400" />
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleHeartClick}
                  className="flex items-center gap-1 text-xs"
                  disabled={loading}
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
            )}
          </div>
        )}
        
        {/* Book preview */}
        <div className="p-3">
          <Shelf
            books={shelf.books?.slice(0, 5) || []}
            title={null}
            compact={compact}
            shelfOwner={shelfOwner}
          />
        </div>
        
        {/* Shelf info */}
        {showFooter && (
          <div className="px-3 pb-3 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {shelf.books?.length || 0} books
            </span>
            <span className="text-xs text-gray-400">
              {new Date(shelf.lastUpdated || shelf.updatedAt || new Date().toISOString()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>
      
      {/* Recommendation Request Modal */}
      <RecommendationRequest
        isOpen={recommendationModal.isOpen}
        onClose={() => setRecommendationModal({ isOpen: false, shelfOwner: null, shelfId: null, shelfName: "" })}
        shelfOwner={recommendationModal.shelfOwner}
        shelfId={recommendationModal.shelfId}
        shelfName={recommendationModal.shelfName}
        currentUser={currentUser}
      />
    </>
  );
}