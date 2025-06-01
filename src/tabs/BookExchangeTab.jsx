// BookExchangeTab.jsx
import React, { useState } from "react";
import { useAuth } from "../useAuth";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { Book, MagnifyingGlass, Books, House } from "phosphor-react";
import { useNavigate } from "react-router-dom";

export default function BookExchangeTab() {
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [requestType, setRequestType] = useState("borrow"); // borrow or recommend
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Create a book exchange request
      await addDoc(collection(db, "bookExchanges"), {
        userId: currentUser.uid,
        userName: userData.name || currentUser.email,
        bookTitle,
        bookAuthor,
        requestType,
        message,
        status: "open",
        createdAt: serverTimestamp()
      });

      // Also create a story post about this request
      await addDoc(collection(db, "stories"), {
        userId: currentUser.uid,
        userName: userData.name || currentUser.email,
        type: "bookExchange",
        bookTitle,
        bookAuthor,
        requestType,
        message,
        createdAt: serverTimestamp(),
        reactions: { hearts: [] }
      });

      // Send notification to all users
      if (requestType === "borrow") {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        
        // Create notification object
        const notification = {
          id: `book-request-${Date.now()}`,
          type: "book_request",
          user: {
            uid: currentUser.uid,
            name: userData.name || currentUser.email,
            email: currentUser.email
          },
          bookTitle,
          bookAuthor,
          message: `is looking to borrow "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        // Add notification to each user except the requester
        const batch = [];
        usersSnapshot.forEach(userDoc => {
          if (userDoc.id !== currentUser.uid) {
            const userRef = doc(db, "users", userDoc.id);
            const userData = userDoc.data();
            const notifications = userData.notifications || [];
            
            batch.push(
              updateDoc(userRef, {
                notifications: [notification, ...notifications].slice(0, 50)
              })
            );
          }
        });
        
        // Execute all updates
        await Promise.all(batch);
      }

      alert(`Your ${requestType} request has been posted!${requestType === "borrow" ? " All users have been notified." : ""}`);
      setBookTitle("");
      setBookAuthor("");
      setMessage("");
    } catch (err) {
      console.error("Error creating book exchange request:", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Exchange</h1>
        <p className="text-gray-300">Request to borrow books or ask for recommendations</p>
        <button 
          onClick={() => navigate("/tabs")}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 mx-auto"
        >
          <House size={18} />
          Back to Home
        </button>
      </div>

      <div className="max-w-md mx-auto bg-gray-800/60 rounded-xl p-6 border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Request Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRequestType("borrow")}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  requestType === "borrow" 
                    ? "bg-purple-600" 
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <Book size={20} />
                Borrow a Book
              </button>
              <button
                type="button"
                onClick={() => setRequestType("recommend")}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  requestType === "recommend" 
                    ? "bg-purple-600" 
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <Books size={20} />
                Get Recommendations
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="bookTitle" className="block text-sm font-medium mb-1">
              {requestType === "borrow" ? "Book Title" : "Book Genre/Topic"}
            </label>
            <input
              id="bookTitle"
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={requestType === "borrow" ? "Enter book title" : "Enter genre or topic"}
              required
            />
          </div>

          <div>
            <label htmlFor="bookAuthor" className="block text-sm font-medium mb-1">
              {requestType === "borrow" ? "Author (optional)" : "Preferred Authors (optional)"}
            </label>
            <input
              id="bookAuthor"
              type="text"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={requestType === "borrow" ? "Enter author name" : "Enter preferred authors"}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={
                requestType === "borrow"
                  ? "Explain why you want to borrow this book and for how long..."
                  : "Describe what kind of recommendations you're looking for..."
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading || !bookTitle.trim()}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
              loading || !bookTitle.trim()
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <MagnifyingGlass size={20} />
                {requestType === "borrow" ? "Post Borrow Request" : "Ask for Recommendations"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}