import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Shelf from './Shelf';
import { useAuth } from '../useAuth';

const SeeMyShelf = () => {
  const { currentUser } = useAuth();
  const [shelves, setShelves] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchShelves = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setShelves(data.shelves || []);
        }
      } catch (err) {
        console.error('Failed to load shelves:', err);
      }
    };

    fetchShelves();
  }, [currentUser]);

  const saveShelves = async (updatedShelves) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    setShelves(updatedShelves);
    await setDoc(userRef, { shelves: updatedShelves }, { merge: true });
  };

  const addShelf = async () => {
    const name = prompt('Enter a name for your new shelf:');
    if (!name) return;
    const newShelf = {
      id: `shelf-${Date.now()}`,
      name,
      books: [],
    };
    const updated = [...shelves, newShelf];
    await saveShelves(updated);
  };

  const updateShelfBooks = async (shelfId, books) => {
    const updated = shelves.map(shelf =>
      shelf.id === shelfId ? { ...shelf, books } : shelf
    );
    await saveShelves(updated);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📚 My Shelves</h2>
        <button
          onClick={addShelf}
          className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded shadow"
        >
          ➕ Add Shelf
        </button>
      </div>

      {shelves.length === 0 ? (
        <div className="text-gray-500 italic">
          No shelves created yet. Click "Add Shelf" to get started!
        </div>
      ) : (
        <div className="space-y-10">
          {shelves.map(shelf => (
            <div key={shelf.id} className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">📁 {shelf.name}</h3>
              <Shelf
                shelfId={shelf.id}
                books={shelf.books}
                updateBooks={(updated) => updateShelfBooks(shelf.id, updated)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeeMyShelf;
