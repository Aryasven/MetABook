// Contribute.jsx
import { useState } from "react";
import { useAuth } from "./useAuth";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";

export function Contribute() {
  const [note, setNote] = useState("");
  const { currentUser } = useAuth();

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
    <div className="h-full w-full flex flex-col items-center justify-center text-center text-white px-6 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">❤️ About the Developer</h1>
        <p className="text-lg font-medium max-w-2xl">
          This project was lovingly crafted by Upasana — explorer of books, builder of ideas,
          and dreamer of shelf-spanning stories. <br /> Want to contribute? Drop a note, share a bug,
          or join the build.
        </p>
      </div>

      <div className="w-full max-w-md mt-8">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="w-full p-4 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Write your message to the developer here..."
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
