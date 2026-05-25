import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { PomodoroProvider } from './context/PomodoroContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PomodoroProvider>
      <App />
    </PomodoroProvider>
  </React.StrictMode>
);
