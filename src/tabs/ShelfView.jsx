import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ShelfView() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [spineMode, setSpineMode] = useState(true); // Toggle for spine/cover view

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

  if (notFound)
    return <div className="p-6 text-red-500">User “{username}” not found or no shelf available.</div>;

  if (!userData)
    return <div className="p-6 text-gray-500">Loading {username}'s shelf...</div>;

  const shelfSections = [
    { label: "Read", books: userData.books?.read || [] },
    { label: "Want to Read", books: userData.books?.wantToRead || [] },
  ];

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
    <div className="p-6 space-y-12">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">
          {username}'s Bookshelf
        </h1>
        <button
          className="px-3 py-1 text-sm rounded-lg bg-violet-200 hover:bg-violet-300 font-semibold shadow-md"
          onClick={() => setSpineMode(!spineMode)}
        >
          {spineMode ? "Switch to Cover View" : "Switch to Spine View"}
        </button>
      </div>

      {shelfSections.map(({ label, books }) =>
        books.length === 0 ? null : (
          <div key={label}>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{label}</h2>

            {/* Shelf Plank */}
            <div className="relative bg-amber-300 h-6 rounded-b-xl shadow-inner mt-10"></div>

            {/* Books on Shelf */}
            <div className="-mt-28 flex flex-wrap gap-5 px-2 pb-12 items-end">
              {books.map((book, i) => (
                <div key={book.id} className="relative z-10" title={book.title}>
                  {spineMode ? (
                    <div
                      className={`w-10 h-48 bg-gradient-to-b ${getSpineColor(
                        i
                      )} rounded-sm shadow-md flex items-center justify-center transform hover:scale-105 transition`}
                    >
                      <p className="text-[10px] text-white font-semibold rotate-90 whitespace-nowrap">
                        {book.title}
                      </p>
                    </div>
                  ) : (
                    <div className="w-[100px] bg-white shadow-lg rounded-lg overflow-hidden transition-transform hover:-translate-y-2">
                      <img
                        src={book.thumbnail || "https://via.placeholder.com/128x195"}
                        alt={book.title}
                        className="w-full h-48 object-cover"
                      />
                      <p className="text-xs text-center mt-1 font-medium truncate">
                        {book.title}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
