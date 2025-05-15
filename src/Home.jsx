
import React from "react";
import bookshelfImg from "./assets/bookshelf.png";
import { ChatBubbleOvalLeftEllipsisIcon, GiftIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/solid";

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const StoryCard = ({ user }) => {
  const type = user.stories[0]?.type;
  const iconMap = {
    review: ChatBubbleOvalLeftEllipsisIcon,
    giveaway: GiftIcon,
    swap: ArrowsRightLeftIcon
  };
  const Icon = iconMap[type] || ChatBubbleOvalLeftEllipsisIcon;
  const colorMap = {
    review: "bg-blue-100 text-blue-700",
    giveaway: "bg-purple-100 text-purple-700",
    swap: "bg-green-100 text-green-700"
  };
  const colorClass = colorMap[type] || "bg-gray-100 text-gray-700";

  return (
    <div className={`min-w-[200px] max-w-xs rounded-xl shadow-md p-4 mr-4 ${colorClass} hover:shadow-lg transition`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-6 w-6" />
        <span className="font-semibold">{user.username}</span>
      </div>
      <p className="text-sm italic">“{user.stories[0]?.text}”</p>
    </div>
  );
};

const BookshelfCard = ({ user }) => (
  <div className="min-w-[420px] rounded-xl shadow-lg p-4 bg-white mr-4 hover:shadow-xl transition">
    <h3 className="text-center font-semibold text-lg mb-2">{user.username}'s Shelf</h3>
    <div className="relative w-[400px] h-[600px] mx-auto bg-cover rounded" style={{ backgroundImage: `url(${bookshelfImg})` }}>
      {user.books.map((book, idx) => {
        const shelf = Math.floor(idx / 3) % ShelfY.length;
        const posX = shelfLefts[idx % 3];
        return (
          <img
            key={book.id}
            src={book.thumbnail}
            alt={book.title}
            className="absolute cursor-pointer hover:scale-110 transition"
            title={book.title}
            style={{
              top: ShelfY[shelf] - 100,
              left: posX,
              width: "80px",
              height: "100px"
            }}
          />
        );
      })}
    </div>
  </div>
);

export default function Home({ users, onStoryClick }) {
  return (
    <div className="p-4 space-y-8">
      <h2 className="text-xl font-bold mb-2">📢 What others are sharing</h2>
      <div className="flex overflow-x-auto pb-2">
        {users.map((user) => (
          <StoryCard key={user.username} user={user} />
        ))}
      </div>

      <h2 className="text-xl font-bold mb-2">📚 Bookshelves</h2>
      <div className="flex overflow-x-auto pb-4">
        {users.map((user) => (
          <BookshelfCard key={user.username} user={user} />
        ))}
      </div>
    </div>
  );
}
