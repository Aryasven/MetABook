// ReadingStatsDebug.jsx - For debugging only
import React from 'react';

export default function ReadingStatsDebug({ user }) {
  if (!user || !user.shelves) {
    return <div className="text-white p-3 bg-red-900/50 rounded-lg mb-3">No user or shelves data</div>;
  }
  
  // Log shelf information to console for debugging
  console.log("User shelves:", user.shelves.map(s => ({
    name: s.name,
    bookCount: s.books?.length || 0
  })));
  
  return (
    <div className="text-white p-3 bg-gray-800/50 rounded-lg mb-3 text-xs">
      <h3 className="font-bold mb-2">Shelf Debug Info:</h3>
      <ul className="space-y-1">
        {user.shelves.map((shelf, i) => (
          <li key={i}>
            {shelf.name}: {shelf.books?.length || 0} books
          </li>
        ))}
      </ul>
    </div>
  );
}