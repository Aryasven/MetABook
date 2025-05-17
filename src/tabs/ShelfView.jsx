// ShelfView.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ShelfView() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchUserShelf = async () => {
      try {
        const userDoc = doc(db, "users", username);
        const snap = await getDoc(userDoc);
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load shelf:", err);
        setNotFound(true);
      }
    };
    fetchUserShelf();
  }, [username]);

  if (notFound) return <div className="p-6 text-red-500">User “{username}” not found or no shelf available.</div>;

  if (!userData) return <div className="p-6 text-gray-500">Loading {username}'s shelf...</div>;

  const books = [...(userData.books?.read || []), ...(userData.books?.wantToRead || [])];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{username}'s Bookshelf</h1>
      {books.length === 0 ? (
        <div className="text-gray-500 italic">No books added yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white shadow rounded p-4 text-center hover:shadow-lg transition">
              <img
                src={book.thumbnail || "https://via.placeholder.com/128x195"}
                alt={book.title}
                className="w-full h-48 object-cover mx-auto mb-2"
              />
              <div className="font-semibold line-clamp-2">{book.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
