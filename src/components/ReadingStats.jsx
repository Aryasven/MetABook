// ReadingStats.jsx
import React, { useEffect } from 'react';
import { BookOpen, Books, Trophy, ArrowRight } from 'phosphor-react';
import { Link } from 'react-router-dom';

export default function ReadingStats({ user }) {
  // Debug logging to see user data structure
  useEffect(() => {
    if (user) {
      console.log("User data for stats:", {
        hasBooks: !!user.books,
        readBooks: user.books?.read?.length || 0,
        wantToReadBooks: user.books?.wantToRead?.length || 0,
        shelves: user.shelves?.map(s => ({name: s.name, count: s.books?.length || 0})) || []
      });
    }
  }, [user]);

  // Calculate reading stats
  const calculateStats = () => {
    if (!user) return { completed: 0, current: 0 };
    
    // Always prioritize the "Currently Reading" shelf for current reading count
    const currentlyReadingShelf = user.shelves?.find(shelf => 
      shelf.name?.toLowerCase() === "currently reading" || 
      shelf.name?.toLowerCase() === "reading"
    );
    const currentlyReading = currentlyReadingShelf?.books?.length || 0;
    
    // Check for books in the "read" tab of the library
    const readBooks = user.books?.read || [];
    const completedBooks = readBooks.length;
    
    // If we have data from the read tab, use it for completed books
    if (completedBooks > 0) {
      return {
        completed: completedBooks,
        current: currentlyReading
      };
    }
    
    // Fallback to shelves for completed books if read tab doesn't have data
    if (user.shelves) {
      // Find "Read" shelf
      const readShelf = user.shelves.find(shelf => 
        shelf.name?.toLowerCase() === "read" || 
        shelf.name?.toLowerCase() === "completed"
      );
      
      // Count books from read shelf
      const shelfCompletedBooks = readShelf?.books?.length || 0;
      
      return {
        completed: shelfCompletedBooks,
        current: currentlyReading
      };
    }
    
    return { completed: 0, current: currentlyReading };
  };
  
  const stats = calculateStats();
  
  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-3 border border-blue-800/30 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Trophy size={16} weight="fill" className="text-yellow-400" />
          <h3 className="font-medium text-sm">My Reading Stats</h3>
        </div>
        <Link 
          to={`/shelf/${user.uid}`}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
        >
          View All <ArrowRight size={10} />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/60 rounded-lg p-2 flex items-center gap-2">
          <div className="bg-purple-900/50 p-1.5 rounded-full">
            <Books size={16} className="text-purple-400" />
          </div>
          <div>
            <span className="text-lg font-bold block leading-tight">{stats.completed}</span>
            <span className="text-xs text-gray-400">Books Read</span>
          </div>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-2 flex items-center gap-2">
          <div className="bg-blue-900/50 p-1.5 rounded-full">
            <BookOpen size={16} className="text-blue-400" />
          </div>
          <div>
            <span className="text-lg font-bold block leading-tight">{stats.current}</span>
            <span className="text-xs text-gray-400">Currently Reading</span>
          </div>
        </div>
      </div>
    </div>
  );
}