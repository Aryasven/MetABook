import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookBookmark,
  UsersThree,
  ArrowsLeftRight,
  Megaphone
} from "phosphor-react";
import logo from "./assets/metabook_logo.png";
import { useAuth } from "./useAuth";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const features = [
  { 
    icon: BookBookmark, 
    label: "What I'm Into",
    description: "Track your reading journey"
  },
  { 
    icon: UsersThree, 
    label: "Peek at Others",
    description: "Discover what friends are reading"
  },
  { 
    icon: ArrowsLeftRight, 
    label: "Wanna Swap?",
    description: "Exchange books with the community"
  },
  { 
    icon: Megaphone, 
    label: "You Gotta Read This",
    description: "Share recommendations with friends"
  }
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 overflow-hidden flex flex-col items-center justify-center px-4 py-8 md:px-6 md:py-0">
      {/* floating visuals */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse blur-2xl"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              animationDuration: `${6 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Login/Register buttons at the top */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {currentUser ? (
          <button
            onClick={() => navigate("/tabs")}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 shadow text-sm"
          >
            Go to My Home
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 shadow text-sm"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 shadow text-sm"
            >
              Register
            </button>
          </>
        )}
      </div>

      {/* PWA Install at the top left */}
      <div className="absolute top-4 left-4 z-20">
        <PWAInstallPrompt compact={true} />
      </div>

      <div className="z-10 text-center space-y-6 max-w-4xl">
        <div className="space-y-1">
          <img src={logo} alt="Met·A·Book Logo" className="w-60 mx-auto" />
          <p className="text-xl text-gray-300 italic">the place for book-lovers</p>
        </div>

        <p className="text-lg max-w-2xl text-gray-300 mx-auto mt-2">
          📚 Met·A·Book is your cozy corner in the literary universe! Share what's on your nightstand, discover hidden gems from fellow bookworms, and pass along beloved stories.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {features.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex flex-col items-center w-36 sm:w-48 bg-gray-800/80 shadow-lg rounded-xl p-3 border border-gray-700 hover:border-purple-500 transition-all">
              <div className="bg-purple-600/30 p-2 rounded-full mb-2">
                <Icon size={24} weight="duotone" className="text-purple-400" />
              </div>
              <h3 className="font-bold text-sm text-white">{label}</h3>
              <p className="text-xs text-gray-300 mt-1 hidden sm:block">{description}</p>
            </div>
          ))}
        </div>

        {/* Home button removed from here since it's now at the top */}
      </div>
    </div>
  );
}