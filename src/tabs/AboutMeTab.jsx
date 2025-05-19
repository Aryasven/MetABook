// AboutMe.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AboutMe() {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setPhotoURL(data.userImage || "");
        setBio(data.bio || "");
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, {
      name,
      userImage: photoURL,
      bio
    }, { merge: true });
    alert("Profile updated!");
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-white bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
      <h1 className="text-3xl font-bold mb-6">👤 About Me</h1>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block mb-1 text-sm font-medium">Display Name</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. Upasana"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Profile Picture URL</label>
          <input
            type="url"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://example.com/avatar.jpg"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Short Bio</label>
          <textarea
            rows="3"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Tell us something about you..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="pt-4">
          <button type="submit" className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 transition">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
