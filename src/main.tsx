// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )




import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { supabase } from './lib/supabase';

async function init() {
  // 1️⃣ Check if URL hash has OAuth tokens
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#', ''));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      // Set the session so AuthContext sees the user
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    // Clear the hash so HashRouter can work normally
    window.location.hash = '#/dashboard';
  }

  // 2️⃣ Render the app
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Run initialization
init();
