import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTheme } from './lib/theme';
import { initReminders } from './lib/reminders/notify';
import './index.css';

// Before the first paint, so there is no flash of the wrong theme
initTheme();
initReminders();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
