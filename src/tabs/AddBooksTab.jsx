// AddBooksTab.jsx (Unified: Search + Want to Read/Read + Shelves)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../useAuth';
import Shelf from './Shelf';
import { MagnifyingGlass, BookOpen, BookmarkSimple, Books, Plus, ArrowRight, PencilSimple, Trash, CaretUp, CaretDown } from 'phosphor-react';

export default function AddBooksTab() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [wantToRead, setWantToRead] = useState([]);
  const [read, setRead] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [editingShelf, setEditingShelf] = useState(null);

  const searchRef = useRef(null);
  const shelvesRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchBooksAndShelves = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setWantToRead(data.books?.wantToRead || []);
          setRead(data.books?.read || []);
          setShelves(data.shelves || []);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooksAndShelves();
  }, [currentUser]);

  const saveBooks = async (updatedWantToRead, updatedRead) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        books: { wantToRead: updatedWantToRead, read: updatedRead }
      }, { merge: true });
    } catch (err) {
      console.error("Error saving books:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveShelves = async (updatedShelves) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      setShelves(updatedShelves);
      await setDoc(userRef, { shelves: updatedShelves }, { merge: true });
      
      // Trigger a global update to refresh data in other components
      if (typeof window.updateUsers === 'function') {
        // Fetch all users to update the global state
        const snapshot = await getDocs(collection(db, 'users'));
        const userData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        window.updateUsers(userData);
      }
    } catch (err) {
      console.error("Error saving shelves:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`);
      setResults(res.data.items || []);
    } catch (err) {
      console.error("Error searching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  const addBook = async (book, category) => {
    const exists = [...wantToRead, ...read].some(b => b.id === book.id);
    if (exists) return;
    
    setLoading(true);
    try {
      if (category === 'read') {
        const updated = [...read, book];
        setRead(updated);
        await saveBooks(wantToRead, updated);
      } else {
        const updated = [...wantToRead, book];
        setWantToRead(updated);
        await saveBooks(updated, read);
      }
    } catch (err) {
      console.error("Error adding book:", err);
    } finally {
      setLoading(false);
    }
  };

  const moveBook = async (book, from, to) => {
    setLoading(true);
    try {
      let updatedWant = wantToRead, updatedRead = read;
      if (from === 'read') {
        updatedRead = read.filter(b => b.id !== book.id);
        updatedWant = [...wantToRead, book];
      } else {
        updatedWant = wantToRead.filter(b => b.id !== book.id);
        updatedRead = [...read, book];
      }
      setWantToRead(updatedWant);
      setRead(updatedRead);
      await saveBooks(updatedWant, updatedRead);
    } catch (err) {
      console.error("Error moving book:", err);
    } finally {
      setLoading(false);
    }
  };

  const addShelf = async () => {
    if (!currentUser) return;
    
    // Use a more modern approach instead of prompt
    const name = prompt('Enter a name for your new shelf:');
    if (!name) return;
    
    setLoading(true);
    try {
      const newShelf = { id: `shelf-${Date.now()}`, name, books: [] };
      const updated = [...shelves, newShelf];
      await saveShelves(updated);
      setTimeout(() => shelvesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error("Error adding shelf:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const renameShelf = async (shelfId) => {
    const shelf = shelves.find(s => s.id === shelfId);
    if (!shelf) return;
    
    const newName = prompt('Enter a new name for this shelf:', shelf.name);
    if (!newName || newName === shelf.name) return;
    
    setLoading(true);
    try {
      const updated = shelves.map(s => 
        s.id === shelfId ? { ...s, name: newName } : s
      );
      await saveShelves(updated);
    } catch (err) {
      console.error("Error renaming shelf:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteShelf = async (shelfId) => {
    if (!confirm('Are you sure you want to delete this shelf? All books will be removed from this shelf.')) {
      return;
    }
    
    setLoading(true);
    try {
      const updated = shelves.filter(s => s.id !== shelfId);
      await saveShelves(updated);
    } catch (err) {
      console.error("Error deleting shelf:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Move shelf up in the order
  const moveShelfUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const updatedShelves = [...shelves];
    const temp = updatedShelves[index];
    updatedShelves[index] = updatedShelves[index - 1];
    updatedShelves[index - 1] = temp;
    
    setShelves(updatedShelves);
    saveShelves(updatedShelves);
  };
  
  // Move shelf down in the order
  const moveShelfDown = (index) => {
    if (index === shelves.length - 1) return; // Already at the bottom
    
    const updatedShelves = [...shelves];
    const temp = updatedShelves[index];
    updatedShelves[index] = updatedShelves[index + 1];
    updatedShelves[index + 1] = temp;
    
    setShelves(updatedShelves);
    saveShelves(updatedShelves);
  };

  const addToShelfDropdown = (book) => {
    const handleSelect = async (e) => {
      const shelfId = e.target.value;
      if (!shelfId) return;
      
      const bookAlreadyExists = shelves.some(shelf =>
        shelf.books.some(b => b.id === book.id)
      );
      
      if (bookAlreadyExists) {
        alert("This book is already on one of your shelves.");
        e.target.value = "";
        return;
      }

      setLoading(true);
      try {
        const updated = shelves.map(shelf => {
          if (shelf.id === shelfId) {
            const newBooks = [...shelf.books, book];
            return { ...shelf, books: newBooks };
          }
          return shelf;
        });
        
        setShelves(updated);
        await saveShelves(updated);
        e.target.value = "";
      } catch (err) {
        console.error("Error adding to shelf:", err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="relative w-full">
        <select
          className="w-full text-xs mt-1 bg-gray-800 text-white border border-gray-700 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          onChange={handleSelect}
          defaultValue=""
        >
          <option value="" disabled>Add to Shelf</option>
          {shelves.map(shelf => (
            <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderBookCard = (book, section) => {
    const isSearchResult = section === 'search';
    
    return (
      <div key={book.id} className={`${isSearchResult ? 'w-40' : 'w-32'} p-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500 transition-all`}>
        <div className="relative group">
          <img
            src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
            alt={book.volumeInfo.title}
            className={`w-full ${isSearchResult ? 'h-48' : 'h-36'} object-cover rounded-md shadow-md`}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-md flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all">
              {section === 'search' && (
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => addBook(book, 'wantToRead')} 
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md transition-colors"
                  >
                    Want to Read
                  </button>
                  <button 
                    onClick={() => addBook(book, 'read')} 
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-colors"
                  >
                    Mark as Read
                  </button>
                </div>
              )}
              {section === 'wantToRead' && (
                <button 
                  onClick={() => moveBook(book, 'wantToRead', 'read')} 
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-colors"
                >
                  Mark as Read
                </button>
              )}
              {section === 'read' && (
                <button 
                  onClick={() => moveBook(book, 'read', 'wantToRead')} 
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md transition-colors"
                >
                  Want to Read
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 line-clamp-2 text-sm font-medium text-gray-200">{book.volumeInfo.title}</div>
        <div className="mt-1 text-xs text-gray-400 line-clamp-1">{book.volumeInfo.authors?.join(', ')}</div>
        {addToShelfDropdown(book)}
      </div>
    );
  };

  const tabs = [
    { id: 'search', label: 'Search', icon: MagnifyingGlass },
    { id: 'wantToRead', label: 'Want to Read', icon: BookmarkSimple, count: wantToRead.length },
    { id: 'read', label: 'Read', icon: BookOpen, count: read.length },
    { id: 'shelves', label: 'My Shelves', icon: Books, count: shelves.length }
  ];

  return (
    <div className="p-4 sm:p-5 text-white max-w-[95%] w-full mx-auto bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg -mt-2 sm:-mt-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-purple-600 p-2 rounded-full">
          <Books size={22} weight="bold" />
        </div>
        <h1 className="text-xl font-bold">My Library</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-700 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'search' && searchInputRef.current) {
                setTimeout(() => searchInputRef.current.focus(), 100);
              }
              if (tab.id === 'shelves' && shelvesRef.current) {
                setTimeout(() => shelvesRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Search Section */}
      {activeTab === 'search' && (
        <div ref={searchRef}>
          <form onSubmit={searchBooks} className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass size={20} className="text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for books by title, author, or ISBN..."
              className="w-full pl-10 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md transition-colors"
            >
              Search
            </button>
          </form>

          {results.length > 0 && (
            <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MagnifyingGlass size={20} className="text-purple-400" />
                Search Results
              </h3>
              <div className="flex flex-wrap gap-4">
                {results.map(book => renderBookCard(book, 'search'))}
              </div>
            </div>
          )}

          {query && results.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400">
              No books found matching your search. Try different keywords.
            </div>
          )}
        </div>
      )}

      {/* Want to Read Section */}
      {activeTab === 'wantToRead' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BookmarkSimple size={20} className="text-purple-400" />
              Want to Read
            </h3>
            <button
              onClick={() => {
                setActiveTab('search');
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="text-sm flex items-center gap-1 text-purple-400 hover:text-purple-300"
            >
              <Plus size={16} />
              Add Books
            </button>
          </div>
          
          {wantToRead.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {wantToRead.map(book => renderBookCard(book, 'wantToRead'))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <BookmarkSimple size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400">Your "Want to Read" list is empty.</p>
              <button
                onClick={() => {
                  setActiveTab('search');
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="mt-2 text-purple-400 hover:text-purple-300 flex items-center gap-1 mx-auto"
              >
                <Plus size={16} />
                Add Books
              </button>
            </div>
          )}
        </div>
      )}

      {/* Read Section */}
      {activeTab === 'read' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen size={20} className="text-green-400" />
              Read
            </h3>
            <button
              onClick={() => {
                setActiveTab('search');
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="text-sm flex items-center gap-1 text-purple-400 hover:text-purple-300"
            >
              <Plus size={16} />
              Add Books
            </button>
          </div>
          
          {read.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {read.map(book => renderBookCard(book, 'read'))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <BookOpen size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400">Your "Read" list is empty.</p>
              <button
                onClick={() => {
                  setActiveTab('search');
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="mt-2 text-purple-400 hover:text-purple-300 flex items-center gap-1 mx-auto"
              >
                <Plus size={16} />
                Add Books
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shelves Section */}
      {activeTab === 'shelves' && (
        <div ref={shelvesRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Books size={20} className="text-purple-400" />
              My Shelves
            </h2>
            <button
              onClick={addShelf}
              className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-all"
            >
              <Plus size={18} weight="bold" />
              Add Shelf
            </button>
          </div>
          
          {shelves.length > 0 ? (
            <div className="space-y-6">
              {shelves.map((shelf, index) => (
                <div 
                  key={shelf.id}
                  className="bg-gray-900 p-3 rounded-lg border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveShelfUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded-t ${index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-purple-400 hover:bg-gray-800'}`}
                          title="Move shelf up"
                        >
                          <CaretUp size={14} />
                        </button>
                        <button
                          onClick={() => moveShelfDown(index)}
                          disabled={index === shelves.length - 1}
                          className={`p-1 rounded-b ${index === shelves.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-purple-400 hover:bg-gray-800'}`}
                          title="Move shelf down"
                        >
                          <CaretDown size={14} />
                        </button>
                      </div>
                      <h3 className="text-lg font-semibold">{shelf.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            renameShelf(shelf.id);
                          }}
                          className="text-gray-400 hover:text-purple-400 p-1 rounded-full hover:bg-gray-800 transition-colors"
                          title="Rename shelf"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteShelf(shelf.id);
                          }}
                          className="text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-800 transition-colors"
                          title="Delete shelf"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('search');
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }}
                      className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors"
                    >
                      <Plus size={14} />
                      Add Book
                    </button>
                  </div>
                  <Shelf
                    books={shelf.books || []}
                    title={null} // We already show the title above
                    updateBooks={(updated) => {
                      const updatedShelves = shelves.map(s =>
                        s.id === shelf.id ? { ...s, books: updated } : s
                      );
                      setShelves(updatedShelves);
                      saveShelves(updatedShelves);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <Books size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400">You haven't created any shelves yet.</p>
              <button
                onClick={addShelf}
                className="mt-2 text-purple-400 hover:text-purple-300 flex items-center gap-1 mx-auto"
              >
                <Plus size={16} />
                Create a Shelf
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}