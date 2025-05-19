// ShelfFilters.jsx
import React from "react";
import { FunnelSimple, X, Star, ArrowsDownUp } from "phosphor-react";

export default function ShelfFilters({ 
  showFilters, 
  setShowFilters, 
  genreFilter, 
  setGenreFilter, 
  sortOption, 
  setSortOption, 
  featuredOnly, 
  setFeaturedOnly,
  genres
}) {
  return (
    <div className={`${showFilters ? 'block' : 'hidden'} bg-gray-800 rounded-lg p-4 border border-gray-700 animate-fade-in`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Filter & Sort</h3>
        <button 
          onClick={() => setShowFilters(false)}
          className="p-1 rounded-full hover:bg-gray-700"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Genre</label>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sort Options */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Sort By</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        
        {/* Featured Toggle */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={featuredOnly}
                onChange={() => setFeaturedOnly(!featuredOnly)}
              />
              <div className={`block w-10 h-6 rounded-full ${featuredOnly ? 'bg-purple-600' : 'bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${featuredOnly ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium flex items-center gap-1">
              <Star size={16} weight={featuredOnly ? "fill" : "regular"} className={featuredOnly ? "text-yellow-400" : "text-gray-400"} />
              Featured Only
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}