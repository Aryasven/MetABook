// Shelf.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../useAuth';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useDroppable, useDraggable, DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BookCard = ({ book, listeners, attributes, setNodeRef, transform, transition }) => {
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-32 p-2 m-2 rounded-xl bg-white shadow text-sm text-center hover:shadow-lg"
      title={book.volumeInfo?.title || 'Untitled'}
    >
      <img
        src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
        alt={book.volumeInfo?.title}
        className="w-full h-40 object-cover rounded mb-1"
      />
      <div className="line-clamp-2">{book.volumeInfo?.title}</div>
    </div>
  );
};

const SortableBook = ({ book, id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <BookCard
      book={book}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      transform={transform}
      transition={transition}
    />
  );
};

const Shelf = ({ shelfId, books, updateBooks }) => {
  const { currentUser } = useAuth();
  const [localBooks, setLocalBooks] = useState(books);
  const userRef = doc(db, 'users', currentUser.uid);

  useEffect(() => {
    const fetchShelves = async () => {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const matched = data.shelves?.find(shelf => shelf.id === shelfId);
        if (matched) setLocalBooks(matched.books || []);
      }
    };
    if (currentUser) fetchShelves();
  }, [currentUser, shelfId]);

  const saveShelfBooks = async (updatedBooks) => {
    const snap = await getDoc(userRef);
    let shelves = snap.data().shelves || [];
    shelves = shelves.map(shelf => shelf.id === shelfId ? { ...shelf, books: updatedBooks } : shelf);
    await setDoc(userRef, { shelves }, { merge: true });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localBooks.findIndex(b => b.id === active.id);
    const newIndex = localBooks.findIndex(b => b.id === over.id);
    const reordered = arrayMove(localBooks, oldIndex, newIndex);
    setLocalBooks(reordered);
    updateBooks(reordered);
    await saveShelfBooks(reordered);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localBooks.map(book => book.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap">
          {localBooks.map(book => (
            <SortableBook key={book.id} id={book.id} book={book} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default Shelf;
