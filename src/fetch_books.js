// sample_books.js
// const fetch = require("node-fetch");
const fs = require("fs");

const topics = ["fiction", "history", "self-help", "science", "tech"];
const results = [];

(async () => {
  for (const topic of topics) {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${topic}&maxResults=100000`);
    const data = await res.json();
    data.items?.forEach((item) => {
      const info = item.volumeInfo;
      results.push({
        id: item.id,
        title: info.title,
        authors: info.authors,
        thumbnail: info.imageLinks?.thumbnail,
        rating: info.averageRating,
        count: info.ratingsCount
      });
    });
  }

  fs.writeFileSync("sample_books.json", JSON.stringify(results, null, 2));
})();
