// CommunitiesTab.jsx
import React from "react";
import { Users, BookOpen, Calendar, UserCirclePlus, UsersThree } from "phosphor-react";
import { Link } from "react-router-dom";

export default function CommunitiesTab() {
  const communityFeatures = [
    {
      title: "Book Clubs",
      icon: <UsersThree size={32} weight="duotone" className="text-purple-400" />,
      description: "Join virtual book clubs to discuss books with other readers",
      comingSoon: true
    },
    {
      title: "Reading Challenges",
      icon: <Calendar size={32} weight="duotone" className="text-blue-400" />,
      description: "Create or join reading challenges with friends",
      comingSoon: true
    },
    {
      title: "Similar Readers",
      icon: <UserCirclePlus size={32} weight="duotone" className="text-green-400" />,
      description: "Find users with similar reading tastes",
      comingSoon: true
    },
    {
      title: "Featured Users",
      icon: <Users size={32} weight="duotone" className="text-pink-400" />,
      description: "Discover popular users and their bookshelves",
      comingSoon: false
    }
  ];

  return (
    <div className="h-full w-full text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Community</h1>
        <p className="text-gray-300">Connect with other readers and join book-related activities</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {communityFeatures.map((feature) => (
          <div 
            key={feature.title}
            className={`bg-gray-800/60 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all ${feature.comingSoon ? 'opacity-70' : ''}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gray-700/50 p-3 rounded-full">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-xl">{feature.title}</h3>
                {feature.comingSoon && (
                  <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-300 mb-4">{feature.description}</p>
            <button 
              className={`w-full py-2 rounded-lg text-center ${
                feature.comingSoon 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              disabled={feature.comingSoon}
            >
              {feature.comingSoon ? 'Coming Soon' : 'Explore'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// For backward compatibility
export function Communities() {
  return <CommunitiesTab />;
}