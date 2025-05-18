// Shelf.jsx
import React, { useEffect, useState } from 'react';

const BookCard = ({ book }) => (
  <div className="w-20 h-28 bg-gray-800 rounded shadow flex items-center justify-center p-1 overflow-hidden">
    <img
      src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
      alt={book.volumeInfo?.title}
      className="h-full object-contain"
      title={book.volumeInfo?.title}
    />
  </div>
);

const Shelf = ({ books, title }) => {
  const [booksPerRow, setBooksPerRow] = useState(6);
  
  // Update books per row based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setBooksPerRow(3); // Small mobile: 3 books per row
      } else if (window.innerWidth < 640) {
        setBooksPerRow(4); // Mobile: 4 books per row
      } else {
        setBooksPerRow(6); // Tablet/Desktop: 6 books per row
      }
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const uniqueBooks = books.filter((book, index, self) =>
    index === self.findIndex(b => b.id === book.id)
  );

  const rows = [];
  for (let i = 0; i < uniqueBooks.length; i += booksPerRow) {
    rows.push(uniqueBooks.slice(i, i + booksPerRow));
  }

  return (
    <div className="w-fit">
      {title && <h3 className="text-lg font-semibold text-left mb-2">{title}</h3>}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="relative h-40 w-full">
            <img
              src="/wood-texture.jpg"
              alt="Wooden shelf"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            <div className="relative z-10 flex justify-start items-end gap-0.5 xs:gap-1 sm:gap-4 h-full px-1 sm:px-4 md:px-6">
              {row.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shelf;