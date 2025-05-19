// EnhancedShelvesTab.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkSimple, MagnifyingGlass, User, Heart, Books } from "phosphor-react";
import { useAuth } from "../useAuth";
import Shelf from "./Shelf";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EnhancedShelvesTab({ users, onHeartReaction }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Extract individual shelves with user attribution
  const allShelves = users.flatMap(user => {
    if (!user.shelves) return [];
    
    return user.shelves
      .filter(shelf => shelf.books?.length > 0)
      .map(shelf => ({ 
        ...shelf, 
        user: { 
          uid: user.uid, 
          username: user.username,
          name: user.name || user.username,
          email: user.email
        },
        displayName: `${user.name || user.username}'s ${shelf.name}`
      }));
  });

  // Filter shelves based on search
  const filteredShelves = allShelves.filter(shelf => 
    searchQuery === "" || 
    shelf.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle heart reaction on a shelf
  const handleHeartReaction = async (e, shelf) => {
    e.stopPropagation(); // Prevent navigation when clicking heart
    
    if (!currentUser) return; // Must be logged in to react
    
    // If external handler is provided, use it
    if (onHeartReaction) {
      // Find the user that owns this shelf
      const shelfOwner = users.find(u => u.uid === shelf.user.uid || u.username === shelf.user.username);
      if (shelfOwner) {
        onHeartReaction(e, shelfOwner, shelf, 'shelf');
        return;
      }
    }
    
    // Otherwise handle reaction internally
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
      
      // Find the user that owns this shelf
      const shelfOwner = users.find(u => u.uid === shelf.user.uid || u.username === shelf.user.username);
      
      if (shelfOwner) {
        // Update the shelf in the user's shelves array
        const updatedShelves = shelfOwner.shelves.map(s => 
          s.id === shelf.id ? updatedShelf : s
        );
        
        // Update Firestore
        const userRef = doc(db, "users", shelfOwner.uid || shelfOwner.username);
        await updateDoc(userRef, { shelves: updatedShelves });
        
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

  // Empty state when no shelves are available
  if (filteredShelves.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Discover Bookshelves</h2>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shelves..."
              className="w-full pl-10 p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full py-8 text-gray-400">
          <div className="text-center">
            <Books size={32} className="mx-auto mb-2 text-gray-600" />
            <p>{searchQuery ? "No shelves match your search." : "No bookshelves available yet."}</p>
            <button
              onClick={() => navigate("/tabs/add-books")}
              className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
            >
              Create your bookshelf
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Discover Bookshelves</h2>
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shelves..."
            className="w-full pl-10 p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Shelves grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShelves.map(shelf => (
          <div 
            key={shelf.id}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500 cursor-pointer"
            onClick={() => navigate(`/shelf/${shelf.user.uid}?shelfId=${shelf.id}`)}
          >
            {/* Shelf header */}
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gray-700 p-1.5 rounded-full">
                  <User size={16} className="text-purple-400" />
                </div>
                <span className="font-medium text-sm">{shelf.displayName}</span>
              </div>
              
              <button 
                onClick={(e) => handleHeartReaction(e, shelf)}
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
            
            {/* Book preview */}
            <div className="p-3">
              <Shelf
                books={shelf.books?.slice(0, 5) || []}
                title={null}
                compact={true}
              />
            </div>
            
            {/* Shelf info */}
            <div className="px-3 pb-3 text-xs text-gray-400">
              {shelf.books?.length || 0} books
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}