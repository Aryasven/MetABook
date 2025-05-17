// AddBooks.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../useAuth';

const AddBooks = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [wantToRead, setWantToRead] = useState([]);
  const [read, setRead] = useState([]);

  const fetchBooks = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWantToRead(data.books?.wantToRead || []);
        setRead(data.books?.read || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [currentUser, refreshTrigger]);

  const saveBooks = async (updatedWantToRead, updatedRead) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      books: {
        wantToRead: updatedWantToRead,
        read: updatedRead
      }
    }, { merge: true });
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

  const renderBookCard = (book, category) => (
    <div
      key={book.id}
      className="w-40 p-2 m-2 rounded-2xl shadow bg-white text-sm hover:shadow-lg transition-all"
      title={book.volumeInfo.title}
    >
      <img
        src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195?text=No+Cover'}
        alt={book.volumeInfo.title}
        className="w-full h-48 object-cover rounded"
      />
      <div className="mt-1 font-semibold line-clamp-2">{book.volumeInfo.title}</div>
      <div className="mt-1 flex flex-col gap-1">
        <button
          onClick={() => moveBook(book, category, category === 'read' ? 'wantToRead' : 'read')}
          className="text-xs bg-blue-100 rounded px-2 py-1"
        >
          Move to {category === 'read' ? 'Want to Read' : 'Read'}
        </button>
        <button className="text-xs bg-green-100 rounded px-2 py-1">
          Add to Shelf
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
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
                <div className="mt-1 line-clamp-2 text-sm">{book.volumeInfo.title}</div>
                <button
                  onClick={() => addBook(book, 'wantToRead')}
                  className="mt-1 text-xs bg-yellow-100 px-2 py-1 rounded"
                >
                  Add to Want to Read
                </button>
                <button
                  onClick={() => addBook(book, 'read')}
                  className="mt-1 text-xs bg-green-100 px-2 py-1 rounded"
                >
                  Mark as Read
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">📚 Want to Read</h3>
        <div className="flex flex-wrap">
          {wantToRead.map(book => renderBookCard(book, 'wantToRead'))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">✅ Read</h3>
        <div className="flex flex-wrap">
          {read.map(book => renderBookCard(book, 'read'))}
        </div>
      </div>
    </div>
  );
};

export default AddBooks;
