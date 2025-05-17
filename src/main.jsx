
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Make sure this is imported before App


// Apply styles to html and body elements
document.documentElement.style.height = '100%';
document.body.style.margin = '0';
document.body.style.minHeight = '100vh';
document.body.style.background = 'linear-gradient(to bottom right, #f5f3ff, #fce7f3)';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
