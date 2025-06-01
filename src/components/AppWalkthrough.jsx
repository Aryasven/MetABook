// AppWalkthrough.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, BookmarkSimple, Heart, ChatCircleText, BookOpen, Books } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    title: "Welcome to MetABook!",
    content: "Let's take a quick tour of the main features to help you get started.",
    icon: BookOpen
  },
  {
    title: "Build Your Library",
    content: "Create your own bookshelves and add books to your collection. Click 'Build My Library' on the home page to get started.",
    icon: Books,
    action: { label: "Build Library", path: "/tabs/add-books" }
  },
  {
    title: "Discover Bookshelves",
    content: "Browse through other readers' bookshelves to discover new books, or chat about their collection.",
    icon: BookmarkSimple,
    action: { label: "Go to Discover", path: "/", tabId: "shelves" }
  },
  {
    title: "Follow Readers",
    content: "Follow readers with similar tastes by visiting their profile and clicking the Follow button.",
    icon: BookmarkSimple
  },
  {
    title: "Interact with Books",
    content: "Click on any book to see details, ask for reviews, or request to borrow.",
    icon: BookOpen
  },
  {
    title: "Join the Conversation",
    content: "Share your reading journey and connect with fellow book lovers through stories and comments.",
    icon: ChatCircleText,
    action: { label: "View Stories", path: "/", tabId: "stories" }
  }
];

export default function AppWalkthrough({ isOpen, onClose, setActiveTab }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWalkthrough, setShowWalkthrough] = useState(isOpen);
  const navigate = useNavigate();
  
  useEffect(() => {
    setShowWalkthrough(isOpen);
  }, [isOpen]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    // Save to localStorage that user has seen the walkthrough
    localStorage.setItem('metabook_walkthrough_completed', 'true');
    setShowWalkthrough(false);
    onClose();
  };
  
  const handleAction = (action) => {
    if (action.tabId) {
      setActiveTab(action.tabId);
    }
    if (action.path) {
      navigate(action.path);
    }
    handleComplete();
  };
  
  if (!showWalkthrough) return null;
  
  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600/30 p-2 rounded-full">
                <StepIcon size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
            </div>
            <button 
              onClick={handleComplete}
              className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-300 mb-6">{step.content}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-purple-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {step.action ? (
                <button
                  onClick={() => handleAction(step.action)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
                >
                  {step.action.label}
                </button>
              ) : null}
              
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
