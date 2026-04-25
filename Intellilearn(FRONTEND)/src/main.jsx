import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.jsx'

try {
  const raw = localStorage.getItem('intellilearn_detailed_settings');
  const parsed = raw ? JSON.parse(raw) : null;
  const darkEnabled = parsed?.darkMode !== false;
  document.documentElement.classList.toggle('dark', darkEnabled);
} catch {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
