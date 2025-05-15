
import React from "react";
import bookshelfImg from "./assets/bookshelf.png";

const ShelfY = [132, 275, 414, 556];
const shelfLefts = [20, 130, 240];

const StoryCircle = ({ user, onClick }) => {
  const color = {
    review: "ring-blue-500",
    swap: "ring-green-500",
    giveaway: "ring-purple-500"
  }[user.stories[0]?.type] || "ring-gray-300";

  return (
    <div onClick={() => onClick(user)} className={`w-20 h-20 rounded-full ring-4 ${color} ring-offset-2 flex items-center justify-center cursor-pointer hover:scale-105 transition`}>
      <img src="https://via.placeholder.com/60" alt={user.username} className="w-16 h-16 rounded-full object-cover" />
    </div>
  );
};

export default function Home({ users, onStoryClick }) {
  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4 border-b">
        {users.map((user) => (
          <div key={user.username} className="flex flex-col items-center text-sm">
            <StoryCircle user={user} onClick={onStoryClick} />
            <p className="mt-1">{user.username}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-8 overflow-x-auto">
        {users.map((user) => (
          <div key={user.username} className="min-w-[400px]">
            <h3 className="font-semibold text-center text-lg mb-1">{user.username}'s Shelf</h3>
            <div className="relative w-[400px] h-[600px] bg-cover" style={{ backgroundImage: `url(${bookshelfImg})` }}>
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
        ))}
      </div>
    </div>
  );
}
