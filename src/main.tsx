import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// OAuth callbacks (?code=...) are exchanged automatically by the supabase
// client (flowType: "pkce" in lib/supabase.ts).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
