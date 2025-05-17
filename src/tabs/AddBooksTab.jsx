// AddBooksTab.jsx (Unified: Search + Want to Read/Read + Shelves)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../useAuth';
import Shelf from './Shelf';

export default function AddBooksTab() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [wantToRead, setWantToRead] = useState([]);
  const [read, setRead] = useState([]);
  const [shelves, setShelves] = useState([]);

  const searchRef = useRef(null);
  const shelvesRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchBooksAndShelves = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setWantToRead(data.books?.wantToRead || []);
        setRead(data.books?.read || []);
        setShelves(data.shelves || []);
      }
    };
    fetchBooksAndShelves();
  }, [currentUser]);

  const saveBooks = async (updatedWantToRead, updatedRead) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      books: { wantToRead: updatedWantToRead, read: updatedRead }
    }, { merge: true });
  };

  const saveShelves = async (updatedShelves) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    setShelves(updatedShelves);
    await setDoc(userRef, { shelves: updatedShelves }, { merge: true });
  };

  const searchBooks = async () => {
    if (!query) return;
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
    setResults(res.data.items || []);
  };

  const addBook = async (book, category) => {
    const exists = [...wantToRead, ...read].some(b => b.id === book.id);
    if (exists) return;
    if (category === 'read') {
      const updated = [...read, book];
      setRead(updated);
      await saveBooks(wantToRead, updated);
    } else {
      const updated = [...wantToRead, book];
      setWantToRead(updated);
      await saveBooks(updated, read);
    }
  };

  const moveBook = async (book, from, to) => {
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
  };

  const addShelf = async () => {
    if (!currentUser) return;
    const name = prompt('Enter a name for your new shelf:');
    if (!name) return;
    const newShelf = { id: `shelf-${Date.now()}`, name, books: [] };
    const updated = [...shelves, newShelf];
    await saveShelves(updated);
    setTimeout(() => shelvesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addToShelfDropdown = (book) => {
    const handleSelect = async (shelfId) => {
      const bookAlreadyExists = shelves.some(shelf =>
        shelf.books.some(b => b.id === book.id)
      );
      if (bookAlreadyExists) return;

      const updated = shelves.map(shelf => {
        if (shelf.id === shelfId) {
          const newBooks = [...shelf.books, book];
          return { ...shelf, books: newBooks };
        }
        return shelf;
      });
      setShelves(updated);
      await saveShelves(updated);
      setQuery('');
      setResults([]);
      shelvesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
      <div className="relative">
        <select
          className="text-xs mt-1 bg-purple-100 px-2 py-1 rounded"
          onChange={(e) => handleSelect(e.target.value)}
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

  return (
    <div className="p-6">
      <div ref={searchRef}>
        <h2 className="text-2xl font-bold mb-4">Add Books</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for books..."
            className="p-2 border rounded w-full"
          />
          <button onClick={searchBooks} className="bg-indigo-500 text-white px-4 py-2 rounded">
            Search
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Suggestions</h3>
            <div className="flex flex-wrap">
              {results.map(book => (
                <div key={book.id} className="w-40 p-2">
                  <img
                    src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                    alt={book.volumeInfo.title}
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{book.volumeInfo.title}</div>
                  <button onClick={() => addBook(book, 'wantToRead')} className="mt-1 text-xs bg-yellow-100 px-2 py-1 rounded w-full">
                    Add to Want to Read
                  </button>
                  <button onClick={() => addBook(book, 'read')} className="mt-1 text-xs bg-green-100 px-2 py-1 rounded w-full">
                    Mark as Read
                  </button>
                  {addToShelfDropdown(book)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">📚 Want to Read</h3>
          <div className="flex flex-wrap">
            {wantToRead.map(book => (
              <div key={book.id} className="w-40 p-2">
                <img
                  src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                  alt={book.volumeInfo.title}
                  className="w-full h-48 object-cover rounded"
                />
                <div className="mt-1 line-clamp-2 text-sm font-medium">{book.volumeInfo.title}</div>
                <button onClick={() => moveBook(book, 'wantToRead', 'read')} className="mt-1 text-xs bg-green-100 px-2 py-1 rounded w-full">
                  Mark as Read
                </button>
                {addToShelfDropdown(book)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">✅ Read</h3>
          <div className="flex flex-wrap">
            {read.map(book => (
              <div key={book.id} className="w-40 p-2">
                <img
                  src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                  alt={book.volumeInfo.title}
                  className="w-full h-48 object-cover rounded"
                />
                <div className="mt-1 line-clamp-2 text-sm font-medium">{book.volumeInfo.title}</div>
                <button onClick={() => moveBook(book, 'read', 'wantToRead')} className="mt-1 text-xs bg-yellow-100 px-2 py-1 rounded w-full">
                  Move to Want to Read
                </button>
                {addToShelfDropdown(book)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shelves Section */}
      <div ref={shelvesRef} className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Shelves</h2>
          <button
            onClick={addShelf}
            className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded shadow"
          >
            ➕ Add Shelf
          </button>
        </div>
        <div className="space-y-10">
          {shelves.map(shelf => (
            <div key={shelf.id}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold"> {shelf.name}</h3>
                <button
                  onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded"
                >
                  ➕ Add Book
                </button>
              </div>
              <Shelf
                shelfId={shelf.id}
                books={shelf.books}
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
      </div>
    </div>
  );
}
