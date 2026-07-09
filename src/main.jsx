import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { flushQueuedEvents } from './lib/analytics.js';
import './index.css';

// Retry any analytics events that failed to send on a previous visit.
flushQueuedEvents();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
