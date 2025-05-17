// Shelf.jsx
import React from 'react';

const BookCard = ({ book }) => (
  <div className="w-20 h-28 bg-white rounded shadow flex items-center justify-center p-1 overflow-hidden">
    <img
      src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
      alt={book.volumeInfo?.title}
      className="h-full object-contain"
      title={book.volumeInfo?.title}
    />
  </div>
);

const Shelf = ({ books, title }) => {
  const uniqueBooks = books.filter((book, index, self) =>
    index === self.findIndex(b => b.id === book.id)
  );

  const booksPerRow = 6;
  const rows = [];
  for (let i = 0; i < uniqueBooks.length; i += booksPerRow) {
    rows.push(uniqueBooks.slice(i, i + booksPerRow));
  }

  return (
    <div className="space-y-8 w-fit">
      {title && <h3 className="text-lg font-semibold text-left mb-1">{title}</h3>}
      {rows.map((row, i) => (
        <div key={i} className="relative h-40 w-full">
          <img
            src="/wood-texture.jpg"
            alt="Wooden shelf"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="relative z-10 flex justify-start items-end gap-4 h-full px-6">
            {row.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Shelf;
