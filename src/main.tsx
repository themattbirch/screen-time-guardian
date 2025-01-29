import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js") 
      .then((registration) =>
        console.log("Service worker registered:", registration.scope)
      )
      .catch((err) =>
        console.error("Service worker registration failed:", err)
      );
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);