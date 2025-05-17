// ShelfView.jsx
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Shelf from "./Shelf";

export default function ShelfView() {
  const { username } = useParams(); // this could be UID or username
  const [searchParams] = useSearchParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  const name = searchParams.get("name") || "User";

  useEffect(() => {
    const fetchUserShelf = async () => {
      try {
        // First try direct lookup by document ID
        const userDoc = doc(db, "users", username);
        const snap = await getDoc(userDoc);
        
        if (snap.exists()) {
          console.log("Found user by ID:", username);
          setUserData(snap.data());
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

  if (notFound)
    return <div className="p-6 text-red-500">User "{name}" not found or no shelf available.</div>;

  if (!userData)
    return <div className="p-6 text-gray-500">Loading {name}'s shelf...</div>;

  return (
    <div className="p-6 space-y-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold text-gray-200">{name}'s Bookshelves</h1>
        <button
          className="px-3 py-1 text-sm rounded-lg bg-violet-200 hover:bg-violet-300 font-semibold shadow-md"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      {userData.shelves?.length > 0 ? (
        <div className="space-y-12">
          {userData.shelves.map((shelf) => (
            <Shelf 
              key={shelf.id} 
              books={shelf.books || []} 
              title={shelf.name} 
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">No shelves added yet.</p>
      )}
    </div>
  );
}