// Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/metabook_logo.png";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "./firebase";
import { useAuth } from "./useAuth";
import { Bell, UserPlus, BookBookmark, ChatCircleText } from "phosphor-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setFriendRequests(data.friendRequests || []);
      }
    };
    fetch();
  }, [currentUser]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        // Get the current user's data including friend requests
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const friendRequests = userData.friendRequests || [];
          const notifications = userData.notifications || [];
          
          // Convert friend requests to notifications
          const friendRequestNotifications = friendRequests.map((request, index) => ({
            id: `fr-${index}`,
            type: "friend_request",
            user: {
              uid: request.fromUid,
              name: request.fromName,
              email: request.fromEmail
            },
            message: "sent you a friend request",
            timestamp: new Date().toISOString(), // We don't have timestamps in requests, use current time
            read: false
          }));
          
          // Combine friend requests with other notifications
          const allNotifications = [...friendRequestNotifications, ...notifications];
          
          // Sort by timestamp, newest first
          allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          setNotifications(allNotifications);
          setUnreadCount(allNotifications.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
  }, [currentUser, friendRequests]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notifications as read
  const markAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 text-white shadow-md z-50">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}> 
        <img src={logo} alt="logo" className="h-10" />
        <span className="text-xl font-bold hidden md:inline">Met·A·Book</span>
      </div>

      {profile && (
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAsRead();
              }}
              className="flex items-center justify-center p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="Notifications"
            >
              <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} className={unreadCount > 0 ? "text-purple-400" : ""} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[100] overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAsRead}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => {
                      // Choose icon based on notification type
                      let NotificationIcon = Bell;
                      if (notification.type === "friend_request") NotificationIcon = UserPlus;
                      else if (notification.type === "shelf_update") NotificationIcon = BookBookmark;
                      else if (notification.type === "new_story") NotificationIcon = ChatCircleText;
                      
                      return (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${!notification.read ? 'bg-gray-800/30' : ''}`}
                          onClick={() => {
                            if (notification.type === "friend_request") {
                              navigate("/tabs/find-friends");
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${!notification.read ? 'bg-purple-600/20' : 'bg-gray-800'}`}>
                              <NotificationIcon size={16} className={!notification.read ? "text-purple-400" : "text-gray-400"} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold">{notification.user.name || notification.user.username}</span> {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <span className="text-sm text-gray-300 hidden sm:inline">Hi, {profile.name || currentUser?.displayName}</span>
          {profile.userImage && (
            <img
              src={profile.userImage}
              alt="profile"
              className="h-9 w-9 rounded-full border border-gray-700 object-cover"
            />
          )}
          <button
            onClick={() => {
              const auth = getAuth();
              signOut(auth).then(() => {
                navigate('/');
              });
            }}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}