// ShelfView.jsx
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Shelf from "./Shelf";
import { Star, StarHalf, BookOpen, Calendar, User } from "phosphor-react";

export default function ShelfView() {
  const { username } = useParams(); // this could be UID or username
  const [searchParams] = useSearchParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const navigate = useNavigate();
  const name = searchParams.get("name") || "User";

  useEffect(() => {
    const fetchUserShelf = async () => {
      try {
        // First try direct lookup by document ID
        const userDoc = doc(db, "users", username);
        const snap = await getDoc(userDoc);
        
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          
          // Set the first book as selected by default
          if (data.shelves?.length > 0 && data.shelves[0].books?.length > 0) {
            setSelectedBook(data.shelves[0].books[0]);
          }
        } else {
          console.error(`User not found with ID: ${username}`);
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load shelf:", err);
        setNotFound(true);
      }
    };
    fetchUserShelf();
  }, [username]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  // Custom BookCard component with click handler
  const BookCard = ({ book }) => (
    <div 
      className={`w-24 h-36 bg-gray-800 rounded shadow flex items-center justify-center p-1 overflow-hidden cursor-pointer transition-all ${selectedBook?.id === book.id ? 'ring-2 ring-purple-500 scale-105' : 'hover:scale-105'}`}
      onClick={() => handleBookClick(book)}
    >
      <img
        src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
        alt={book.volumeInfo?.title}
        className="h-full object-contain"
        title={book.volumeInfo?.title}
      />
    </div>
  );

  // Custom Shelf component that uses our BookCard
  const EnhancedShelf = ({ shelf }) => {
    const books = shelf.books || [];
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-200">{shelf.name}</h3>
        <div className="flex flex-wrap gap-4">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    );
  };

  if (notFound)
    return <div className="p-6 text-red-500">User "{name}" not found or no shelf available.</div>;

  if (!userData)
    return <div className="p-6 text-gray-500">Loading {name}'s shelf...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-200">{name}'s Bookshelves</h1>
        <button
          className="px-3 py-1 text-sm rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold shadow-md"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Shelves */}
        <div className="lg:w-1/2 space-y-6 overflow-y-auto max-h-[75vh]">
          {userData.shelves?.length > 0 ? (
            userData.shelves.map((shelf) => (
              <EnhancedShelf key={shelf.id} shelf={shelf} />
            ))
          ) : (
            <p className="text-gray-400 italic">No shelves added yet.</p>
          )}
        </div>

        {/* Right side - Book details */}
        <div className="lg:w-1/2 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          {selectedBook ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book cover */}
                <div className="flex-shrink-0 flex justify-center">
                  <img
                    src={selectedBook.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                    alt={selectedBook.volumeInfo?.title}
                    className="h-64 object-contain rounded shadow-lg"
                  />
                </div>
                
                {/* Book info */}
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">{selectedBook.volumeInfo?.title}</h2>
                  
                  {selectedBook.volumeInfo?.authors && (
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-gray-400" />
                      <p className="text-gray-300">{selectedBook.volumeInfo.authors.join(", ")}</p>
                    </div>
                  )}
                  
                  {selectedBook.volumeInfo?.publishedDate && (
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-gray-400" />
                      <p className="text-gray-300">{selectedBook.volumeInfo.publishedDate}</p>
                    </div>
                  )}
                  
                  {selectedBook.volumeInfo?.pageCount && (
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={16} className="text-gray-400" />
                      <p className="text-gray-300">{selectedBook.volumeInfo.pageCount} pages</p>
                    </div>
                  )}
                  
                  {/* Rating */}
                  {selectedBook.volumeInfo?.averageRating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(Math.floor(selectedBook.volumeInfo.averageRating))].map((_, i) => (
                        <Star key={i} size={18} weight="fill" className="text-yellow-500" />
                      ))}
                      {selectedBook.volumeInfo.averageRating % 1 !== 0 && (
                        <StarHalf size={18} weight="fill" className="text-yellow-500" />
                      )}
                      <span className="text-gray-300 ml-2">
                        {selectedBook.volumeInfo.averageRating} 
                        {selectedBook.volumeInfo.ratingsCount && ` (${selectedBook.volumeInfo.ratingsCount} ratings)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {selectedBook.volumeInfo?.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-200">Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed" 
                     dangerouslySetInnerHTML={{ __html: selectedBook.volumeInfo.description }} />
                </div>
              )}
              
              {/* User review - placeholder for now */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200">User Review</h3>
                <p className="text-gray-400 italic">No review added yet.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Select a book to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}