// Contribute.jsx
import { useState } from "react";
import { useAuth } from "./useAuth";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { User } from "phosphor-react";

export function Contribute() {
  const [note, setNote] = useState("");
  const { currentUser } = useAuth();

  // Founder information
  const founders = [
    {
      id: "y2moosavAlTPeBq7CwDIggOTfM83",
      name: "Upasana",
      role: "Founder & Chief Architect",
      bio: "Explorer of books, builder of ideas, and dreamer of shelf-spanning stories."
    },
    {
      id: "nvHrXn6EQOVu2kbiVKrNfdp6XEj1",
      name: "Tashefa",
      role: "Co-Founder & Community Director",
      bio: "Connector of readers, curator of stories, and architect of literary communities."
    }
  ];

  if (currentUser === null) {
    return <div className="text-white text-center mt-10">Loading your profile...</div>;
  }

  if (!currentUser) {
    return <div className="text-white text-center mt-10">Please log in to send a message to the developer.</div>;
  }

  const handleSend = async () => {
    if (!note.trim()) return alert("Please enter a message.");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, "feedback"), {
        username: currentUser.uid,
        name: userData.name || "",
        email: currentUser.email || "",
        feedback: note,
        createdAt: serverTimestamp()
      });
      alert("Thanks for your note! It has been saved.");
      setNote("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-white px-6 py-12 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">❤️ About MetABook</h1>
        <p className="text-lg font-medium max-w-2xl">
          This project was lovingly crafted by our team of book enthusiasts.
          <br /> Want to contribute? Drop a note, share a bug, or join the build.
        </p>
      </div>

      {/* Founders Section */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">Meet the Founders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {founders.map(founder => (
            <Link 
              key={founder.id}
              to={`/shelf/${founder.id}?name=${encodeURIComponent(founder.name)}`}
              className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-600/30 p-2 rounded-full">
                  <User size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{founder.name}</h3>
                  <p className="text-sm text-purple-300">{founder.role}</p>
                </div>
              </div>
              <p className="text-gray-300">{founder.bio}</p>
              <p className="text-purple-400 text-sm mt-3 flex items-center">
                View profile and bookshelves →
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md mt-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Send Us a Note</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="w-full p-4 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Write your message to the developers here..."
        />
        <button
          onClick={handleSend}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded shadow"
        >
          Send Note
        </button>
      </div>
    </div>
  );
}