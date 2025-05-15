
import React from "react";
import { BookOpenIcon, UsersIcon, ChatBubbleBottomCenterIcon, StarIcon } from "@heroicons/react/24/outline";

const features = [
  { icon: BookOpenIcon, label: "Book Swapping", top: "20%", left: "10%" },
  { icon: ChatBubbleBottomCenterIcon, label: "Review Stories", top: "35%", right: "15%" },
  { icon: UsersIcon, label: "User Profiles", bottom: "20%", left: "20%" },
  { icon: StarIcon, label: "Borrow Requests", bottom: "25%", right: "10%" },
];

export default function FloatingFeatures() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {features.map(({ icon: Icon, label, ...pos }, idx) => (
        <div
          key={idx}
          className="absolute flex flex-col items-center text-sm text-gray-700 animate-pulse pointer-events-auto"
          style={{ ...pos }}
        >
          <Icon className="h-8 w-8 text-indigo-500" />
          <span className="mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}
