// FeaturedShelves.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, User, Heart } from "phosphor-react";
import Shelf from "./Shelf";

export default function FeaturedShelves({ 
  shelves, 
  currentUser, 
  handleHeartReaction, 
  loading 
}) {
  const navigate = useNavigate();
  
  if (!shelves || shelves.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Star size={20} weight="fill" className="text-yellow-400" />
        Featured Shelves
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelves.slice(0, 3).map(shelf => (
          <div 
            key={`featured-${shelf.id}`}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-yellow-500/30 overflow-hidden hover:border-yellow-500 cursor-pointer shadow-lg relative"
            onClick={() => navigate(`/shelf/${shelf.user.uid}?shelfId=${shelf.id}`)}
          >
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-bl-lg font-medium">
              Featured
            </div>
            
            {/* Shelf header */}
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500/20 p-1.5 rounded-full">
                  <User size={16} className="text-yellow-400" />
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
            <div className="px-3 pb-3 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {shelf.books?.length || 0} books
              </span>
              <span className="text-xs text-gray-400">
                {shelf.genre && shelf.genre !== "general" ? shelf.genre.charAt(0).toUpperCase() + shelf.genre.slice(1) : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}