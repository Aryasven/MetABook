// CompactShelf.jsx
import React, { useEffect, useState } from 'react';
import { CaretDown, CaretUp } from 'phosphor-react';

const BookCard = ({ book, compact = true }) => (
  <div className={`${compact ? "w-16 h-24" : "w-20 h-28"} bg-gray-800 rounded shadow flex items-center justify-center p-1 overflow-hidden`}>
    <img
      src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
      alt={book.volumeInfo?.title}
      className="h-full object-contain"
      title={book.volumeInfo?.title}
    />
  </div>
);

const CompactShelf = ({ books, title, maxRows = 1, onBookClick = null }) => {
  const [booksPerRow, setBooksPerRow] = useState(7);
  const [expanded, setExpanded] = useState(false);
  
  // Update books per row based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setBooksPerRow(4); // Small mobile: 4 books per row
      } else if (window.innerWidth < 640) {
        setBooksPerRow(5); // Mobile: 5 books per row
      } else {
        setBooksPerRow(7); // Tablet/Desktop: 7 books per row
      }
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const needsExpansion = rows.length > maxRows;
  
  // If not expanded and needs expansion, only show limited rows
  const visibleRows = expanded || !needsExpansion ? rows : rows.slice(0, maxRows);

  // Handle book click
  const handleBookClick = (e, book) => {
    e.stopPropagation();
    if (onBookClick) {
      onBookClick(book);
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
          <div key={i} className="relative h-32 w-full">
            <img
              src="/wood-texture.jpg"
              alt="Wooden shelf"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            <div className="relative z-10 flex justify-start items-end gap-0.5 xs:gap-1 h-full px-1 sm:px-4 md:px-6">
              {row.map(book => (
                <div 
                  key={book.id} 
                  onClick={(e) => handleBookClick(e, book)}
                  className={onBookClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}
                >
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactShelf;