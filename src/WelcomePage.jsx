import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Eyeglasses,
  ArrowsLeftRight,
  Gift,
  Megaphone
} from "phosphor-react";
import logo from "./assets/metabook_logo.png";
import { useAuth } from "./useAuth";

const features = [
  { icon: BookOpen, label: "What I’m Into" },
  { icon: Eyeglasses, label: "Peek at Others" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?" },
  { icon: Gift, label: "Take It, It’s Yours!" },
  { icon: Megaphone, label: "You Gotta Read This" }
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 overflow-hidden flex flex-col items-center justify-center px-6">
      {/* floating visuals */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-20 bg-purple-400 rounded-full opacity-10 animate-pulse blur-2xl"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              animationDuration: `${6 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      <div className="z-10 text-center space-y-6">
        <div className="space-y-1">
          <img src={logo} alt="Met·A·Book Logo" className="w-72 mx-auto -mt-12" />
          <p className="text-xl text-gray-300 italic">the place for book-lovers</p>
        </div>

        <p className="text-lg max-w-2xl text-gray-300 mx-auto">
          📚 Met·A·Book is your personal book-sharing space — see what others are reading, share your own bookshelf, give away old favorites, and recommend your latest obsession. Dive into a community where books find new homes and stories spark fresh connections.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-gray-800 shadow-md rounded-xl p-3 border border-gray-700">
              <Icon size={32} weight="duotone" className="text-purple-600" />
              <span className="text-xs font-medium text-gray-200">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-6 justify-center">
          <button
            onClick={() => navigate("/register")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow"
          >
            Register
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-gray-800 text-purple-300 px-6 py-2 rounded-lg border border-purple-500 hover:bg-gray-700 shadow"
          >
            Login
          </button>
          {currentUser && (
            <button
              onClick={() => navigate("/tabs")}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow"
            >
              Go to My Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
