// ReadingStats.jsx
import React from 'react';
import { BookOpen, Books, Trophy, ChartLine, Calendar, ArrowRight } from 'phosphor-react';
import { Link } from 'react-router-dom';

export default function ReadingStats({ user }) {
  // Calculate reading stats
  const calculateStats = () => {
    if (!user || !user.shelves) return { completed: 0, current: 0 };
    
    // Find "Read" and "Currently Reading" shelves
    const readShelf = user.shelves.find(shelf => 
      shelf.name.toLowerCase() === "read" || 
      shelf.name.toLowerCase() === "completed"
    );
    
    const currentlyReadingShelf = user.shelves.find(shelf => 
      shelf.name.toLowerCase() === "currently reading" || 
      shelf.name.toLowerCase() === "reading"
    );
    
    // Count books
    const completedBooks = readShelf?.books?.length || 0;
    const currentlyReading = currentlyReadingShelf?.books?.length || 0;
    
    return {
      completed: completedBooks,
      current: currentlyReading
    };
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
      
      {/* 
      FUTURE GAMIFICATION FEATURES:
      
      1. Reading Milestones
      - Track and celebrate when users reach certain thresholds (5, 10, 25, 50, 100 books)
      - Show progress toward next milestone
      - Award virtual badges or trophies
      
      2. Reading Challenges
      - "Read 12 books this year" with visual progress bar
      - Genre challenges: "Read books from 5 different genres"
      - Monthly themed challenges (e.g., "Read a book published in your birth year")
      - Community challenges where users compete or collaborate
      
      3. Achievement Badges
      - "Night Owl" for reading after midnight
      - "Genre Explorer" for reading across different genres
      - "Speed Reader" for finishing books quickly
      - "Consistent Reader" for maintaining a streak
      - Display badges on profile and in feed
      
      4. Reading Insights
      - Charts showing reading patterns over time
      - "Your favorite genre is Fantasy (35% of your books)"
      - "You read most on Sundays"
      - Reading speed and completion rate analytics
      
      5. Community Comparisons
      - "You're in the top 10% of readers this month"
      - "Your friends are currently reading [Book Title]"
      - Optional leaderboards for most books read
      - Friend activity feed
      
      6. Book Completion Progress
      - Visual progress bars for books in the "Currently Reading" shelf
      - Option to update % complete for each book
      - Estimated completion date based on reading pace
      
      7. Reading Goals Widget
      - Set and track personal reading goals
      - Customizable goals (books per month/year)
      - Celebration animations when goals are met
      - Recommendations based on reading goals
      
      8. Reading Streaks
      - Track consecutive days of reading
      - Rewards for maintaining streaks
      - "Don't break the chain" motivation
      - Recovery mechanics for missed days
      */}
    </div>
  );
}