// SidebarLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { List, X } from "phosphor-react";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";

const tabGroups = [
  {
    label: "Explore",
    items: [
      { label: "Home", path: "/tabs" },
      { label: "Communities", path: "/tabs/communities" },
    ]
  },
  {
    label: "My Profile",
    items: [
      { label: "About Me", path: "/tabs/about-me" },
      { label: "My Library", path: "/tabs/add-books" },
      { label: "Add Reviews", path: "/tabs/add-reviews" },
      { label: "Find Friends", path: "/tabs/find-friends" }
    ]
  },
  {
    label: "Developer's Desk",
    items: [
      { label: "Support & Contribute", path: "/tabs/contribute" }
    ]
  }
];

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Removed notification states
  const { currentUser } = useAuth();
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Check screen size on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Removed notification-related effects and functions

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-30 bg-gray-800 p-2 rounded-md"
      >
        {sidebarOpen ? <X size={24} /> : <List size={24} />}
      </button>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:static z-20 h-full w-64 bg-gray-950 shadow-lg p-4 space-y-4 text-white
        transition-transform duration-300 ease-in-out`}>
        <h2 className="text-lg font-bold mb-4 mt-10 md:mt-0"> Met·A·Book</h2>
        {tabGroups.map(group => (
          <div key={group.label} className="mb-4">
            <h4 className="text-xs uppercase text-gray-400 mb-2">{group.label}</h4>
            {group.items.map(({ label, path }) => (
              <NavLink
                key={label}
                to={path}
                onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-3 py-2 rounded ${
                    isActive ? "bg-purple-700 text-white font-semibold" : "hover:bg-purple-800"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content with top navigation bar */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar */}
        <div className="bg-gray-900/90 backdrop-blur-md p-2 flex justify-end items-center border-b border-gray-800 sticky top-0 z-50">
          {/* Empty top bar - notification bell moved to Navbar */}
        </div>
        
        {/* Main content area */}
        <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-indigo-800/30 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}