import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { captureUtm, flushQueuedEvents } from './lib/analytics.js';
import './index.css';

// Remember UTM params (e.g. the Instagram bio link's ?utm_source=instagram)
// and retry any analytics events that failed to send on a previous visit.
captureUtm();
flushQueuedEvents();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
