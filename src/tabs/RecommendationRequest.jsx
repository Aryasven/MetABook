// RecommendationRequest.jsx
import React, { useState } from "react";
import { X, BookOpen, ChatCircleText, Check } from "phosphor-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function RecommendationRequest({ 
  isOpen, 
  onClose, 
  shelfOwner, 
  shelfId, 
  shelfName, 
  currentUser 
}) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Predefined questions for recommendations
  const recommendationQuestions = [
    "What book from this shelf would you recommend for a beginner?",
    "Which book had the biggest impact on you?",
    "If I could only read one book from this shelf, which should it be?",
    "What's the most underrated book in this collection?",
    "Which book would be good for someone who enjoys [genre]?"
  ];
  
  const toggleQuestion = (question) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== question));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };
  
  const handleSubmit = async () => {
    if ((!selectedQuestions.length && !customQuestion.trim()) || !currentUser) return;
    
    setLoading(true);
    try {
      // Prepare questions to send
      const questions = [
        ...selectedQuestions,
        ...(customQuestion.trim() ? [customQuestion.trim()] : [])
      ];
      
      // Create recommendation request notification
      const newRequest = {
        id: `rec-request-${Date.now()}`,
        type: "recommendation_request",
        user: {
          uid: currentUser.uid || currentUser.username,
          name: currentUser.name || currentUser.displayName,
          email: currentUser.email
        },
        message: `asked for book recommendations from your "${shelfName}" shelf`,
        timestamp: new Date().toISOString(),
        read: false,
        shelfId: shelfId,
        questions: questions
      };
      
      // Get the target user's existing notifications
      const targetUserRef = doc(db, "users", shelfOwner.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      
      if (targetUserSnap.exists()) {
        const targetUserData = targetUserSnap.data();
        const notifications = targetUserData.notifications || [];
        
        // Update notifications in Firestore
        await updateDoc(targetUserRef, { 
          notifications: [newRequest, ...notifications].slice(0, 50) // Keep only the 50 most recent
        });
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Error sending recommendation request:", err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700 animate-fade-in">
        {success ? (
          <div className="text-center py-8">
            <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check size={32} weight="bold" className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
            <p className="text-gray-300">
              Your recommendation request has been sent to {shelfOwner.name || shelfOwner.username}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={24} className="text-blue-400" />
                Ask for Recommendations
              </h3>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">
              Ask {shelfOwner.name || shelfOwner.username} for book recommendations from their "{shelfName}" shelf.
            </p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Select questions (optional):</h4>
              <div className="space-y-2">
                {recommendationQuestions.map((question, index) => (
                  <div 
                    key={index}
                    onClick={() => toggleQuestion(question)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedQuestions.includes(question)
                        ? 'bg-purple-900/30 border-purple-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <p className="text-sm">{question}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Or ask your own question:</h4>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="What would you like to know about these books?"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!selectedQuestions.length && !customQuestion.trim())}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  loading || (!selectedQuestions.length && !customQuestion.trim())
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ChatCircleText size={18} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}