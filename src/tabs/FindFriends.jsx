// FindFriends.jsx
import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../useAuth";
import { MagnifyingGlass, EnvelopeSimple, Phone, UserPlus, Check } from "phosphor-react";

export default function FindFriends() {
  const [contacts, setContacts] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentRequests, setSentRequests] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsersAndRequests = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // Get current user data including friend requests
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setFriendRequests(data.friendRequests || []);
          setSentRequests(data.sentRequests || []);
        }

        // Get all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser.uid); // Exclude current user
        setAllUsers(users);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsersAndRequests();
  }, [currentUser]);

  const handleGmailConnect = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    const auth = getAuth();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const token = result._tokenResponse.oauthAccessToken;
      const res = await fetch(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const extracted = (data.connections || []).map((c) => {
        const name = c.names?.[0]?.displayName || "Unnamed";
        const email = c.emailAddresses?.[0]?.value || "";
        return { name, email };
      }).filter(c => c.email);
      setContacts(extracted);

      const emailList = extracted.map(c => c.email.toLowerCase());
      const matched = allUsers.filter(user => emailList.includes((user.email || "").toLowerCase()));
      setMatchedUsers(matched);

    } catch (err) {
      console.error("Gmail fetch failed:", err);
      alert("Failed to load Gmail contacts.");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // Add request to target user's friendRequests
      const targetRef = doc(db, "users", targetUser.id);
      await updateDoc(targetRef, {
        friendRequests: arrayUnion({
          fromUid: currentUser.uid,
          fromEmail: currentUser.email,
          fromName: currentUser.displayName || "Unknown"
        })
      });
      
      // Track sent requests in current user's document
      const myRef = doc(db, "users", currentUser.uid);
      await updateDoc(myRef, {
        sentRequests: arrayUnion({
          toUid: targetUser.id,
          toEmail: targetUser.email,
          toName: targetUser.name || targetUser.username || "Unknown"
        })
      });
      
      // Update local state
      setSentRequests(prev => [...prev, { toUid: targetUser.id }]);
      
    } catch (err) {
      console.error("Failed to send friend request:", err);
      alert("Could not send friend request. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (request) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const myRef = doc(db, "users", currentUser.uid);
      const fromRef = doc(db, "users", request.fromUid);

      // Add each other as friends
      await updateDoc(myRef, {
        friends: arrayUnion({ uid: request.fromUid, name: request.fromName, email: request.fromEmail }),
        friendRequests: arrayRemove(request)
      });

      await updateDoc(fromRef, {
        friends: arrayUnion({ uid: currentUser.uid, name: currentUser.displayName || "", email: currentUser.email }),
        sentRequests: arrayRemove({
          toUid: currentUser.uid,
          toEmail: currentUser.email,
          toName: currentUser.displayName || ""
        })
      });

      // Update local state
      setFriendRequests(prev => prev.filter(r => r.fromUid !== request.fromUid));
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept friend request.");
    } finally {
      setLoading(false);
    }
  };

  // Filter search results and exclude users who already have pending requests
  const searchResults = searchQuery.length > 1
    ? allUsers.filter(user =>
        ((user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
         (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
         (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
        !sentRequests.some(req => req.toUid === user.id)
      )
    : [];

  const hasAlreadySentRequest = (userId) => {
    return sentRequests.some(req => req.toUid === userId);
  };

  return (
    <div className="p-6 text-white max-w-4xl mx-auto bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-purple-600 p-3 rounded-full">
          <UserPlus size={24} weight="bold" />
        </div>
        <h1 className="text-2xl font-bold">Find Friends</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlass size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, username or email..."
          className="w-full pl-10 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <EnvelopeSimple size={20} className="text-purple-400" />
            Incoming Friend Requests
          </h2>
          <ul className="space-y-3">
            {friendRequests.map((req, i) => (
              <li key={i} className="p-4 bg-gray-900 rounded-lg flex justify-between items-center hover:bg-gray-850 transition-colors">
                <div>
                  <span className="font-medium">{req.fromName}</span>
                  <p className="text-sm text-gray-400">{req.fromEmail}</p>
                </div>
                <button
                  onClick={() => acceptFriendRequest(req)}
                  className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Check size={16} weight="bold" />
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <ul className="space-y-3">
            {searchResults.map((user, i) => (
              <li key={i} className="p-4 bg-gray-900 rounded-lg flex justify-between items-center hover:bg-gray-850 transition-colors">
                <div>
                  <span className="font-medium">{user.name || user.username}</span>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => sendFriendRequest(user)}
                  disabled={hasAlreadySentRequest(user.id)}
                  className={`flex items-center gap-1 text-sm px-4 py-2 rounded-lg transition-colors ${
                    hasAlreadySentRequest(user.id)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  <UserPlus size={16} weight="bold" />
                  {hasAlreadySentRequest(user.id) ? "Request Sent" : "Add Friend"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Connect Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleGmailConnect}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 px-6 py-3 rounded-lg text-white shadow-lg transition-all"
        >
          <EnvelopeSimple size={20} weight="bold" />
          Connect Gmail Contacts
        </button>

        <button
          onClick={() => alert("Phone contact sync is only available on the mobile app.")}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 px-6 py-3 rounded-lg text-white shadow-lg transition-all"
        >
          <Phone size={20} weight="bold" />
          Sync Phone Contacts
        </button>
      </div>

      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Gmail Matches */}
      {matchedUsers.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Friends You May Know</h2>
          <ul className="space-y-3">
            {matchedUsers.map((user, i) => (
              <li
                key={i}
                className="p-4 bg-gray-900 rounded-lg flex justify-between items-center hover:bg-gray-850 transition-colors"
              >
                <div>
                  <span className="font-medium">{user.name || user.username}</span>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => sendFriendRequest(user)}
                  disabled={hasAlreadySentRequest(user.id)}
                  className={`flex items-center gap-1 text-sm px-4 py-2 rounded-lg transition-colors ${
                    hasAlreadySentRequest(user.id)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  <UserPlus size={16} weight="bold" />
                  {hasAlreadySentRequest(user.id) ? "Request Sent" : "Add Friend"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}