// /src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 

// src/main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/app/' })
      .then((reg) => console.log('SW registered, scope:', reg.scope))
      .catch((err) => console.error('SW registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
