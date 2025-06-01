// UserProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../useAuth';
import ReadingStats from '../components/ReadingStats';
import Shelf from './Shelf';
import { UserCircle, Check, UserPlus, BookOpen } from 'phosphor-react';

export default function UserProfileView() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFriend, setIsFriend] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try to find user by uid first
        const userRef = doc(db, "users", username);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = { uid: userSnap.id, ...userSnap.data() };
          setUser(userData);
          
          // Check if this user is a friend
          if (currentUser) {
            const currentUserRef = doc(db, "users", currentUser.uid);
            const currentUserSnap = await getDoc(currentUserRef);
            if (currentUserSnap.exists()) {
              const currentUserData = currentUserSnap.data();
              setIsFriend(currentUserData.friends?.some(f => f.uid === userData.uid) || false);
              setIsFollowing(currentUserData.following?.some(f => f.uid === userData.uid) || false);
            }
          }
        } else {
          // If not found by uid, try to find by username
          // This would require a query, but for simplicity we'll assume uid is used
          console.error("User not found");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [username, currentUser]);
  
  const handleAddFriend = async () => {
    if (!currentUser || !user) return;
    
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const friendData = {
        uid: user.uid,
        name: user.name || user.displayName || user.username,
        email: user.email
      };
      
      if (isFriend) {
        // Remove friend
        await updateDoc(currentUserRef, {
          friends: arrayRemove(friendData)
        });
        setIsFriend(false);
      } else {
        // Add friend
        await updateDoc(currentUserRef, {
          friends: arrayUnion(friendData)
        });
        setIsFriend(true);
        
        // Also follow if not already following
        if (!isFollowing) {
          await updateDoc(currentUserRef, {
            following: arrayUnion(friendData)
          });
          setIsFollowing(true);
        }
        
        // Send notification to the user
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const notifications = userData.notifications || [];
          
          const newNotification = {
            id: `friend-request-${Date.now()}`,
            type: "friend_request",
            user: {
              uid: currentUser.uid,
              name: currentUser.name || currentUser.displayName,
              email: currentUser.email
            },
            message: "added you as a friend",
            timestamp: new Date().toISOString(),
            read: false
          };
          
          await updateDoc(userRef, {
            notifications: [newNotification, ...notifications].slice(0, 50)
          });
        }
      }
    } catch (err) {
      console.error("Error updating friend status:", err);
    }
  };
  
  const handleFollow = async () => {
    if (!currentUser || !user) return;
    
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const followData = {
        uid: user.uid,
        name: user.name || user.displayName || user.username,
        email: user.email
      };
      
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(followData)
        });
        setIsFollowing(false);
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(followData)
        });
        setIsFollowing(true);
        
        // Send notification to the user
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const notifications = userData.notifications || [];
          
          const newNotification = {
            id: `follow-${Date.now()}`,
            type: "follow",
            user: {
              uid: currentUser.uid,
              name: currentUser.name || currentUser.displayName,
              email: currentUser.email
            },
            message: "started following you",
            timestamp: new Date().toISOString(),
            read: false
          };
          
          await updateDoc(userRef, {
            notifications: [newNotification, ...notifications].slice(0, 50)
          });
        }
      }
    } catch (err) {
      console.error("Error updating follow status:", err);
    }
  };
  
  if (loading) {
    return <div className="text-center p-8 text-gray-400">Loading user profile...</div>;
  }
  
  if (!user) {
    return <div className="text-center p-8 text-gray-400">User not found</div>;
  }
  
  // Find "Want to Read" books
  const wantToReadBooks = user.books?.wantToRead || [];
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* User Header */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600/30 p-3 rounded-full">
              <UserCircle size={48} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name || user.displayName || user.username}</h1>
              <p className="text-gray-400">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
          
          {currentUser && currentUser.uid !== user.uid && (
            <div className="flex gap-2">
              <button
                onClick={handleAddFriend}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
                  isFriend 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white transition-colors`}
              >
                {isFriend ? (
                  <>
                    <Check size={18} weight="bold" />
                    Friends
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Add Friend
                  </>
                )}
              </button>
              
              <button
                onClick={handleFollow}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
                  isFollowing 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white transition-colors`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
        
        {/* Reading Stats */}
        <ReadingStats user={user} />
      </div>
      
      {/* Want to Read Section */}
      {wantToReadBooks.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={24} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Want to Read</h2>
          </div>
          
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex gap-4">
              {wantToReadBooks.map(book => (
                <div key={book.id} className="w-32 flex-shrink-0">
                  <div className="bg-gray-800 rounded shadow h-44 flex items-center justify-center p-1 overflow-hidden">
                    <img
                      src={book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x195'}
                      alt={book.volumeInfo?.title}
                      className="h-full object-contain"
                      title={book.volumeInfo?.title}
                    />
                  </div>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">{book.volumeInfo?.title}</p>
                  <p className="text-xs text-gray-500">{book.volumeInfo?.authors?.[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* User's Shelves */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Bookshelves</h2>
        
        {user.shelves?.length > 0 ? (
          <div className="space-y-8">
            {user.shelves.map(shelf => (
              <div key={shelf.id} className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">{shelf.name}</h3>
                {shelf.books?.length > 0 ? (
                  <Shelf 
                    books={shelf.books} 
                    compact={true}
                    shelfOwner={user}
                  />
                ) : (
                  <p className="text-gray-400 italic">No books in this shelf yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic">No shelves created yet</p>
        )}
      </div>
    </div>
  );
}