// SidebarLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const tabGroups = [
  {
    label: "Explore",
    items: [
      { label: "Home", path: "/tabs" },
    //   { label: "Stories", path: "/tabs/stories" },
    //   { label: "Shelves", path: "/tabs/shelves" },
      { label: "Communities", path: "/tabs/communities" },
    //   { label: "Support & Contribute", path: "/tabs/contribute" }

    ]
  },
  {
    label: "My Profile",
    items: [
    { label: "About Me", path: "/tabs/about-me" },
      { label: "My Library", path: "/tabs/add-books" },
    //   { label: "My Shelf", path: "/tabs/see-my-shelf"},
      { label: "Add Reviews", path: "/tabs/add-reviews" }

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 shadow-lg p-4 space-y-4 text-white">
        <h2 className="text-lg font-bold mb-4"> Met·A·Book</h2>
        {tabGroups.map(group => (
          <div key={group.label} className="mb-4">
            <h4 className="text-xs uppercase text-gray-400 mb-2">{group.label}</h4>
            {group.items.map(({ label, path }) => (
              <NavLink
                key={label}
                to={path}
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

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
