// ShelvesTab.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkSimple, MagnifyingGlass, User, Heart, Books, FunnelSimple, X, ArrowsDownUp, Star } from "phosphor-react";
import { useAuth } from "../useAuth";
import Shelf from "./Shelf";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ShelfFilters from "./ShelfFilters";
import FeaturedShelves from "./FeaturedShelves";
import RecommendationRequest from "./RecommendationRequest";

export default function ShelvesTab({ users, onHeartReaction }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortOption, setSortOption] = useState("recent");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [recommendationModal, setRecommendationModal] = useState({
    isOpen: false,
    shelfOwner: null,
    shelfId: null,
    shelfName: ""
  });
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
        displayName: `${user.name || user.username}'s ${shelf.name}`,
        lastUpdated: shelf.lastUpdated || new Date().toISOString(),
        featured: shelf.featured || false,
        genre: shelf.genre || "general"
      }));
  });

  // Common genres for filtering
  const genres = ["fiction", "non-fiction", "mystery", "sci-fi", "fantasy", "biography", "history", "general"];
  
  // Apply filters and sorting
  const filteredShelves = allShelves
    // Apply search filter
    .filter(shelf => 
      searchQuery === "" || 
      shelf.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.books?.some(book => 
        book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    // Apply genre filter
    .filter(shelf => genreFilter === "all" || shelf.genre === genreFilter)
    // Apply featured filter
    .filter(shelf => !featuredOnly || shelf.featured)
    // Apply sorting
    .sort((a, b) => {
      if (sortOption === "recent") {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      } else if (sortOption === "popular") {
        return (b.reactions?.hearts?.length || 0) - (a.reactions?.hearts?.length || 0);
      } else if (sortOption === "alphabetical") {
        return a.displayName.localeCompare(b.displayName);
      }
      return 0;
    });

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
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Discover Bookshelves</h2>
            {currentUser && (
              <button
                onClick={() => navigate("/tabs/add-books")}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <BookmarkSimple size={16} />
                Manage My Shelf
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlass size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shelves, books, authors..."
                className="w-full pl-10 p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-700 transition-colors`}
            >
              <FunnelSimple size={20} />
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        <ShelfFilters
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          genreFilter={genreFilter}
          setGenreFilter={setGenreFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          featuredOnly={featuredOnly}
          setFeaturedOnly={setFeaturedOnly}
          genres={genres}
        />
        
        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing {filteredShelves.length} {filteredShelves.length === 1 ? 'shelf' : 'shelves'}
        </div>
      </div>

      {/* Featured Shelves Section */}
      {!featuredOnly && filteredShelves.some(shelf => shelf.featured) && (
        <FeaturedShelves
          shelves={filteredShelves.filter(shelf => shelf.featured)}
          currentUser={currentUser}
          handleHeartReaction={handleHeartReaction}
          loading={loading}
        />
      )}

      {/* All Shelves Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShelves.map(shelf => (
          <div 
            key={shelf.id}
            className={`bg-gray-800 rounded-xl border ${shelf.featured ? 'border-yellow-500/30' : 'border-gray-700'} overflow-hidden hover:border-purple-500 cursor-pointer transition-all`}
            onClick={() => navigate(`/shelf/${shelf.user.uid}?shelfId=${shelf.id}`)}
          >
            {/* Shelf header */}
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`${shelf.featured ? 'bg-yellow-500/20' : 'bg-gray-700'} p-1.5 rounded-full`}>
                  <User size={16} className={shelf.featured ? "text-yellow-400" : "text-purple-400"} />
                </div>
                <div>
                  <span className="font-medium text-sm">{shelf.displayName}</span>
                  {shelf.genre && shelf.genre !== "general" && (
                    <span className="text-xs text-gray-400 block">{shelf.genre.charAt(0).toUpperCase() + shelf.genre.slice(1)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Find the shelf owner
                    const shelfOwner = users.find(u => u.uid === shelf.user.uid || u.username === shelf.user.username);
                    if (shelfOwner) {
                      setRecommendationModal({
                        isOpen: true,
                        shelfOwner,
                        shelfId: shelf.id,
                        shelfName: shelf.name
                      });
                    }
                  }}
                  className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Ask for recommendation"
                >
                  <BookmarkSimple size={14} className="text-blue-400" />
                </button>
                
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
                {new Date(shelf.lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
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
    </div>
  );
}