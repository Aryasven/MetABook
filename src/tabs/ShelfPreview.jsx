// components/ShelfPreview.jsx
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ShelfPreview({ username, compactMode = true }) {
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [spineMode, setSpineMode] = useState(true);
  const navigate = useNavigate();

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
        console.error("Failed to load preview shelf:", err);
        setNotFound(true);
      }
    };
    fetchUserShelf();
  }, [username]);

  if (notFound || !userData) return null;

  const books = [...(userData.books?.read || []), ...(userData.books?.wantToRead || [])].slice(0, 10);

  const getSpineColor = (index) => {
    const colors = [
      "from-indigo-300 to-indigo-500",
      "from-pink-300 to-pink-500",
      "from-teal-300 to-teal-500",
      "from-amber-300 to-amber-500",
      "from-rose-300 to-rose-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-2">
        <h3
          className="text-lg font-semibold text-gray-700 hover:text-violet-500 cursor-pointer"
          onClick={() => navigate(`/shelf/${username}`)}
        >
          {username}’s Shelf
        </h3>
        {!compactMode && (
          <button
            onClick={() => setSpineMode(!spineMode)}
            className="text-xs px-2 py-1 rounded bg-violet-100 hover:bg-violet-200"
          >
            {spineMode ? "Cover View" : "Spine View"}
          </button>
        )}
      </div>

      {/* Shelf Plank */}
      <div className="relative bg-amber-300 h-5 rounded-b-xl shadow-inner mt-10"></div>

      {/* Books on Shelf */}
      <div className="-mt-24 flex gap-3 items-end px-1">
        {books.map((book, i) => (
          <div key={book.id} className="relative z-10" title={book.title}>
            {spineMode ? (
              <div
                className={`w-9 h-44 bg-gradient-to-b ${getSpineColor(
                  i
                )} rounded-sm shadow-md flex items-center justify-center transform hover:scale-105 transition`}
              >
                <p className="text-[9px] text-white font-semibold rotate-90 whitespace-nowrap">
                  {book.title}
                </p>
              </div>
            ) : (
              <div className="w-[90px] bg-white shadow-lg rounded-md overflow-hidden transition-transform hover:-translate-y-1">
                <img
                  src={book.thumbnail || "https://via.placeholder.com/128x195"}
                  alt={book.title}
                  className="w-full h-44 object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
