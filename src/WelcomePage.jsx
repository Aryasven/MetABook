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

const features = [
  { icon: BookOpen, label: "What I’m Into" },
  { icon: Eyeglasses, label: "Peeking at Others" },
  { icon: ArrowsLeftRight, label: "Wanna Swap?" },
  { icon: Gift, label: "Take It, It’s Yours!" },
  { icon: Megaphone, label: "You Gotta Read This" }
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 overflow-hidden flex flex-col items-center justify-center px-6">
      {/* floating visuals */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-pulse blur-2xl"
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
          <img src={logo} alt="Met·A·Book Logo" className="w-72 mx-auto -mt-20" />
          <p className="text-xl text-gray-700 italic">the place for book-lovers</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white shadow-md rounded-xl p-4">
              <Icon size={40} weight="duotone" className="text-purple-600" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-6 justify-center">
          <button
            onClick={() => navigate("/register")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow"
          >
            Register
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg border hover:bg-purple-100 shadow"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
