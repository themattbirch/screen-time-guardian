// /src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 

// In src/main.tsx, update the registration:
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Keep service-worker.js in /public, but set scope to /app
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/app'
      });
      console.log('ServiceWorker registered with scope:', registration.scope);
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
