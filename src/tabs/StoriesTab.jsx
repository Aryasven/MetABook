// StoriesTab.jsx
import React, { useState } from "react";
import { ChatCircleText, Heart } from "phosphor-react";

export default function StoriesTab({ users, currentUser, handleHeartReaction, setShowStoryInput, featureMap }) {
  const [expandedStories, setExpandedStories] = useState([]);
  
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

  return (
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
                  <p className={`text-gray-300 ${expandedStories.includes(user.uid || user.username) ? '' : 'line-clamp-6'}`}>{story.text}</p>
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
  );
}