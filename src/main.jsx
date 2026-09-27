import React from 'react';
import { createRoot } from 'react-dom/client';
import ExpenseTracker from './ExpenseTracker.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ExpenseTracker />
  </React.StrictMode>,
);