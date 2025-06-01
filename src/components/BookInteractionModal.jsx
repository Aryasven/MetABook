// BookInteractionModal.jsx
import React, { useState } from 'react';
import { X, BookOpen, ChatCircleText, ArrowsLeftRight, Check, BookmarkSimple } from 'phosphor-react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function BookInteractionModal({ book, isOpen, onClose, currentUser, shelfOwner }) {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const navigate = useNavigate();
  
  if (!isOpen || !book) return null;
  
  const bookInfo = book.volumeInfo || {};
  
  // Check if book is in user's read list
  const isRead = currentUser?.readBooks?.some(b => b.id === book.id);
  const isWantToRead = currentUser?.wantToReadBooks?.some(b => b.id === book.id);
  
  // Handle marking book as read
  const handleMarkAsRead = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      if (isRead) {
        // Remove from read list
        await updateDoc(userRef, {
          readBooks: arrayRemove(book)
        });
      } else {
        // Add to read list
        await updateDoc(userRef, {
          readBooks: arrayUnion(book),
          // If it was in want to read, remove it from there
          ...(isWantToRead ? { wantToReadBooks: arrayRemove(book) } : {})
        });
      }
      
      // Update local state
      if (typeof window.updateCurrentUser === 'function') {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          window.updateCurrentUser({ uid: userSnap.id, ...userSnap.data() });
        }
      }
    } catch (err) {
      console.error("Error updating read status:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle marking book as want to read
  const handleMarkAsWantToRead = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      if (isWantToRead) {
        // Remove from want to read list
        await updateDoc(userRef, {
          wantToReadBooks: arrayRemove(book)
        });
      } else {
        // Add to want to read list
        await updateDoc(userRef, {
          wantToReadBooks: arrayUnion(book),
          // If it was in read, remove it from there
          ...(isRead ? { readBooks: arrayRemove(book) } : {})
        });
      }
      
      // Update local state
      if (typeof window.updateCurrentUser === 'function') {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          window.updateCurrentUser({ uid: userSnap.id, ...userSnap.data() });
        }
      }
    } catch (err) {
      console.error("Error updating want to read status:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle asking for review
  const handleAskForReview = async () => {
    if (!currentUser || !shelfOwner) return;
    setLoading(true);
    
    try {
      // Create notification for the shelf owner
      const targetUserRef = doc(db, "users", shelfOwner.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      
      if (targetUserSnap.exists()) {
        const targetUserData = targetUserSnap.data();
        const notifications = targetUserData.notifications || [];
        
        // Add new notification
        const newNotification = {
          id: `review-request-${Date.now()}`,
          type: "review_request",
          user: {
            uid: currentUser.uid,
            name: currentUser.name || currentUser.displayName,
            email: currentUser.email
          },
          message: `asked for your review of "${bookInfo.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          bookId: book.id,
          book: {
            id: book.id,
            title: bookInfo.title,
            author: bookInfo.authors?.[0] || 'Unknown',
            cover: bookInfo.imageLinks?.thumbnail
          }
        };
        
        // Update notifications in Firestore
        await updateDoc(targetUserRef, { 
          notifications: [newNotification, ...notifications].slice(0, 50)
        });
        
        setRequestSent(true);
      }
    } catch (err) {
      console.error("Error sending review request:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle asking to borrow
  const handleAskToBorrow = async () => {
    if (!currentUser || !shelfOwner) return;
    setLoading(true);
    
    try {
      // Create notification for the shelf owner
      const targetUserRef = doc(db, "users", shelfOwner.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      
      if (targetUserSnap.exists()) {
        const targetUserData = targetUserSnap.data();
        const notifications = targetUserData.notifications || [];
        
        // Add new notification
        const newNotification = {
          id: `borrow-request-${Date.now()}`,
          type: "borrow_request",
          user: {
            uid: currentUser.uid,
            name: currentUser.name || currentUser.displayName,
            email: currentUser.email
          },
          message: `would like to borrow "${bookInfo.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          bookId: book.id,
          book: {
            id: book.id,
            title: bookInfo.title,
            author: bookInfo.authors?.[0] || 'Unknown',
            cover: bookInfo.imageLinks?.thumbnail
          }
        };
        
        // Update notifications in Firestore
        await updateDoc(targetUserRef, { 
          notifications: [newNotification, ...notifications].slice(0, 50)
        });
        
        setRequestSent(true);
      }
    } catch (err) {
      console.error("Error sending borrow request:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle view book details
  const handleViewBookDetails = () => {
    // Navigate to book details page
    navigate(`/book/${book.id}`);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">{bookInfo.title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="w-24 h-36 flex-shrink-0">
              <img
                src={bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                alt={bookInfo.title}
                className="h-full w-full object-cover rounded"
              />
            </div>
            <div>
              <h4 className="font-medium">{bookInfo.title}</h4>
              <p className="text-sm text-gray-400">{bookInfo.authors?.join(', ')}</p>
              <p className="text-xs text-gray-500 mt-1">{bookInfo.publishedDate?.substring(0, 4)}</p>
              
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={handleMarkAsRead}
                  disabled={loading}
                  className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                    isRead 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isRead && <Check size={12} />}
                  {isRead ? 'Read' : 'Mark as Read'}
                </button>
                <button 
                  onClick={handleMarkAsWantToRead}
                  disabled={loading}
                  className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                    isWantToRead 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isWantToRead && <BookmarkSimple size={12} />}
                  Want to Read
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex border-b border-gray-700 mb-3">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm ${activeTab === 'info' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 text-sm ${activeTab === 'actions' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Actions
            </button>
          </div>
          
          {activeTab === 'info' && (
            <div className="text-sm text-gray-300">
              <p className="line-clamp-4">{bookInfo.description || 'No description available.'}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Pages:</span> {bookInfo.pageCount || 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">Category:</span> {bookInfo.categories?.[0] || 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">Language:</span> {bookInfo.language || 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">Publisher:</span> {bookInfo.publisher || 'N/A'}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'actions' && (
            <div className="space-y-3">
              {requestSent ? (
                <div className="p-3 bg-green-600/20 border border-green-600/30 rounded-lg text-center">
                  <p className="text-green-400 font-medium">Request sent successfully!</p>
                  <p className="text-xs text-gray-300 mt-1">The shelf owner will be notified.</p>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleAskForReview}
                    disabled={loading || !shelfOwner}
                    className="w-full flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ChatCircleText size={18} className="text-blue-400" />
                    <span>Ask for a Review</span>
                  </button>
                  <button 
                    onClick={handleAskToBorrow}
                    disabled={loading || !shelfOwner}
                    className="w-full flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowsLeftRight size={18} className="text-green-400" />
                    <span>Ask to Borrow</span>
                  </button>
                </>
              )}
              <button 
                onClick={handleViewBookDetails}
                className="w-full flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <BookOpen size={18} className="text-purple-400" />
                <span>View Book Details</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}