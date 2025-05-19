// FindFriends.jsx
import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../useAuth";
import { MagnifyingGlass, EnvelopeSimple, Phone, UserPlus, Check, Users, UserSwitch } from "phosphor-react";

export default function FindFriends() {
  const [contacts, setContacts] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);
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
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setFriendRequests(data.friendRequests || []);
          setSentRequests(data.sentRequests || []);
          setFriends(data.friends || []);
        }

        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser.uid);
        setAllUsers(users);

        // Calculate mutual friends
        const currentFriendUids = new Set((friends || []).map(f => f.uid));
        const mutuals = users.map(u => {
          const userFriends = u.friends || [];
          const mutual = userFriends.filter(f => currentFriendUids.has(f.uid));
          return mutual.length > 0 ? { ...u, mutualCount: mutual.length } : null;
        }).filter(Boolean);
        setMutualFriends(mutuals);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsersAndRequests();
  }, [currentUser, friends]);

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
      const targetRef = doc(db, "users", targetUser.id);
      await updateDoc(targetRef, {
        friendRequests: arrayUnion({
          fromUid: currentUser.uid,
          fromEmail: currentUser.email,
          fromName: currentUser.displayName || "Unknown"
        })
      });

      const myRef = doc(db, "users", currentUser.uid);
      await updateDoc(myRef, {
        sentRequests: arrayUnion({
          toUid: targetUser.id,
          toEmail: targetUser.email,
          toName: targetUser.name || targetUser.username || "Unknown"
        })
      });

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

      setFriendRequests(prev => prev.filter(r => r.fromUid !== request.fromUid));
      setFriends(prev => [...prev, { uid: request.fromUid, name: request.fromName, email: request.fromEmail }]);
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept friend request.");
    } finally {
      setLoading(false);
    }
  };

  const searchResults = searchQuery.length > 1
    ? allUsers.filter(user =>
        (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasAlreadySentRequest = (userId) => {
    return sentRequests.some(req => req.toUid === userId);
  };

  return (
    <div className="p-6 text-white max-w-4xl mx-auto bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
      {/* Search Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MagnifyingGlass size={20} className="text-purple-400" />
          Find Friends
        </h2>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>

        {searchQuery.length > 1 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-3">Search Results</h3>
            {searchResults.length > 0 ? (
              <ul className="space-y-3">
                {searchResults.map((user) => (
                  <li key={user.id} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-medium">{user.name || user.username}</span>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                    {hasAlreadySentRequest(user.id) ? (
                      <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1 text-sm">
                        <Check size={16} />
                        Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(user)}
                        className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
                      >
                        <UserPlus size={16} />
                        Add Friend
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No users found matching "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-green-400" />
            Friend Requests
          </h2>
          <ul className="space-y-3">
            {friendRequests.map((request, index) => (
              <li key={index} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium">{request.fromName}</span>
                  <p className="text-sm text-gray-400">{request.fromEmail}</p>
                </div>
                <button
                  onClick={() => acceptFriendRequest(request)}
                  className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sent Requests Section */}
      {sentRequests.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserSwitch size={20} className="text-yellow-400" />
            Pending Requests
          </h2>
          <ul className="space-y-3">
            {sentRequests.map((request, index) => (
              <li key={index} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium">{request.toName}</span>
                  <p className="text-sm text-gray-400">{request.toEmail}</p>
                </div>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1 text-sm">
                  <Check size={16} />
                  Request Pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contacts Section */}
      <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <EnvelopeSimple size={20} className="text-indigo-400" />
          Connect with Contacts
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGmailConnect}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <EnvelopeSimple size={18} weight="bold" />
            Connect Gmail
          </button>
          <button
            disabled
            className="flex items-center gap-2 bg-gray-700 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
          >
            <Phone size={18} weight="bold" />
            Phone Contacts (Coming Soon)
          </button>
        </div>

        {matchedUsers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Contacts on MetABook</h3>
            <ul className="space-y-3">
              {matchedUsers.map((user) => (
                <li key={user.id} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-medium">{user.name || user.username}</span>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  {hasAlreadySentRequest(user.id) ? (
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1 text-sm">
                      <Check size={16} />
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(user)}
                      className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      <UserPlus size={16} />
                      Add Friend
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Current Friends */}
      {friends.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-green-400" />
            Your Friends
          </h2>
          <ul className="space-y-3">
            {friends.map((f, i) => (
              <li key={i} className="p-4 bg-gray-900 rounded-lg flex justify-between items-center hover:bg-gray-850 transition-colors">
                <div>
                  <span className="font-medium">{f.name}</span>
                  <p className="text-sm text-gray-400">{f.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mutual Friends */}
      {mutualFriends.length > 0 && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserSwitch size={20} className="text-yellow-400" />
            People with Mutual Friends
          </h2>
          <ul className="space-y-3">
            {mutualFriends.map((u, i) => (
              <li key={i} className="p-4 bg-gray-900 rounded-lg flex justify-between items-center hover:bg-gray-850 transition-colors">
                <div>
                  <span className="font-medium">{u.name || u.username}</span>
                  <p className="text-sm text-gray-400">{u.email}</p>
                  <p className="text-xs text-gray-500">{u.mutualCount} mutual friend(s)</p>
                </div>
                {hasAlreadySentRequest(u.id) ? (
                  <span className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1 text-sm">
                    <Check size={16} weight="bold" />
                    Request Pending
                  </span>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(u)}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <UserPlus size={16} weight="bold" />
                    Add Friend
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}