// FeedTab.jsx
import React, { useState } from "react";
import { Activity, Heart, BookmarkSimple, UserPlus, ChatCircleText } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import ShelfCard from "../components/ShelfCard";

export default function FeedTab({ users, currentUser, handleHeartReaction, setShowStoryInput, featureMap }) {
  const [expandedStories, setExpandedStories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recommendationModal, setRecommendationModal] = useState({
    isOpen: false,
    shelfOwner: null,
    shelfId: null,
    shelfName: ""
  });
  const navigate = useNavigate();
  
  // Filter users who have actually shared stories with text content
  const usersWithStories = users.filter(user => user.stories?.[0]?.text);
  
  // Toggle story expansion
  const toggleExpandStory = (userId) => {
    setExpandedStories(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Combined activity feed with all types of updates
  const activityItems = React.useMemo(() => {
    const items = [
      // Stories
      ...usersWithStories.map(user => ({
        type: 'story',
        user,
        data: user.stories[0],
        timestamp: user.stories[0].timestamp
      })),
      
      // All shelf updates - show only shelves with books
      ...users.flatMap(user => {
        if (!user.shelves) return [];
        
        return user.shelves
          .filter(shelf => shelf.books && shelf.books.length > 0) // Only include shelves with books
          .map(shelf => ({
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
    ];
    
    // Shuffle the items instead of sorting by timestamp
    return items.sort(() => 0.5 - Math.random());
  }, [users, usersWithStories, refreshKey]); // Include refreshKey in dependencies to trigger re-shuffle

  // Empty state check
  const isEmpty = usersWithStories.length === 0 && users.filter(user => user.shelves?.length > 0).length === 0;

  return (
    <div className="space-y-8">
      {/* Recent Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={22} className="text-purple-400" />
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              title="Shuffle content"
            >
              Shuffle
            </button>
            <button 
              onClick={() => setShowStoryInput(featureMap[0])}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Share something
            </button>
          </div>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
          <div className="space-y-4">
            {/* Activity items */}
            {activityItems.map((item, index) => {
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
                      <p className={`text-gray-300 ${expandedStories.includes(user.uid || user.username) ? '' : 'line-clamp-4'}`}>{story.text}</p>
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
                    className="rounded-xl shadow-lg p-3 bg-gray-800/90 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                    onClick={() => navigate(`/shelf/${user.uid || user.username}?name=${encodeURIComponent(user.name || user.username)}`)}
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-300">
                            {shelf.books?.length || 0} {shelf.books?.length === 1 ? 'book' : 'books'} on this shelf
                          </h4>
                          <div className="flex items-center gap-2">
                            {currentUser && currentUser.uid !== user.uid && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open recommendation modal
                                  setRecommendationModal({
                                    isOpen: true,
                                    shelfOwner: user,
                                    shelfId: shelf.id,
                                    shelfName: shelf.name
                                  });
                                }}
                                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                title="Ask for recommendation"
                              >
                                <ChatCircleText size={14} className="text-blue-400" />
                              </button>
                            )}
                            
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
                        <ShelfCard
                          shelf={shelf}
                          shelfOwner={user}
                          currentUser={currentUser}
                          onHeartReaction={handleHeartReaction}
                          compact={true}
                          showHeader={true}
                          showFooter={false}
                          hideHeaderButtons={true}
                        />
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
              return null;
            })}
            
            {/* Empty state */}
            {isEmpty && (
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
  );
}