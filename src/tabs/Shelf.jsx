// Shelf.jsx
import React, { useEffect, useState } from 'react';
import { CaretDown, CaretUp } from 'phosphor-react';
import BookInteractionModal from '../components/BookInteractionModal';
import { useAuth } from '../useAuth';

const BookCard = ({ book, compact }) => (
  <div className={`${compact ? "w-16 h-24" : "w-20 h-28"} bg-gray-800 rounded shadow flex items-center justify-center p-1 overflow-hidden`}>
    <img
      src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
      alt={book.volumeInfo?.title}
      className="h-full object-contain"
      title={book.volumeInfo?.title}
    />
  </div>
);

const Shelf = ({ books, title, compact = false, maxRows = null, onBookClick = null, shelfOwner = null }) => {
  const [booksPerRow, setBooksPerRow] = useState(6);
  const [expanded, setExpanded] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const { currentUser } = useAuth();
  
  // Update books per row based on screen size and compact mode
  useEffect(() => {
    const handleResize = () => {
      if (compact) {
        // Compact mode shows more books per row
        if (window.innerWidth < 480) {
          setBooksPerRow(4); // Small mobile: 4 books per row
        } else if (window.innerWidth < 640) {
          setBooksPerRow(5); // Mobile: 5 books per row
        } else {
          setBooksPerRow(7); // Tablet/Desktop: 7 books per row
        }
      } else {
        // Standard mode
        if (window.innerWidth < 480) {
          setBooksPerRow(3); // Small mobile: 3 books per row
        } else if (window.innerWidth < 640) {
          setBooksPerRow(4); // Mobile: 4 books per row
        } else {
          setBooksPerRow(6); // Tablet/Desktop: 6 books per row
        }
      }
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [compact]);

  // Filter out duplicate books
  const uniqueBooks = books.filter((book, index, self) =>
    index === self.findIndex(b => b.id === book.id)
  );

  // Organize books into rows
  const rows = [];
  for (let i = 0; i < uniqueBooks.length; i += booksPerRow) {
    rows.push(uniqueBooks.slice(i, i + booksPerRow));
  }

  // Determine if we need to show expand/collapse button
  // If maxRows is provided, use that as the threshold, otherwise use 2
  const defaultMaxRows = maxRows || (compact ? 1 : 2);
  const needsExpansion = rows.length > defaultMaxRows;
  
  // If not expanded and needs expansion, only show limited rows
  const visibleRows = expanded || !needsExpansion ? rows : rows.slice(0, defaultMaxRows);

  // Handle book click
  const handleBookClick = (e, book) => {
    e.stopPropagation();
    if (onBookClick) {
      onBookClick(book);
    } else {
      // If no external click handler, show the book interaction modal
      setSelectedBook(book);
      setShowBookModal(true);
      console.log("Opening modal for book:", book.volumeInfo?.title); // Debug log
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {title && <h3 className="text-lg font-semibold text-left">{title}</h3>}
        {needsExpansion && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            {expanded ? (
              <>
                <CaretUp size={14} />
                Show less
              </>
            ) : (
              <>
                <CaretDown size={14} />
                Show all ({rows.length} rows)
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-4">
        {visibleRows.map((row, i) => (
          <div key={i} className={`relative ${compact ? "h-32" : "h-40"} w-full`}>
            <img
              src="/wood-texture.jpg"
              alt="Wooden shelf"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            <div className={`relative z-10 flex justify-start items-end ${compact ? "gap-0.5 xs:gap-1" : "gap-0.5 xs:gap-1 sm:gap-4"} h-full px-1 sm:px-4 md:px-6`}>
              {row.map(book => (
                <div 
                  key={book.id} 
                  onClick={(e) => handleBookClick(e, book)}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <BookCard book={book} compact={compact} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Book Interaction Modal */}
      <BookInteractionModal
        book={selectedBook}
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        currentUser={currentUser}
        shelfOwner={shelfOwner}
      />
    </div>
  );
};

export default Shelf;