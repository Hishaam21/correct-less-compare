import React from 'react';
import { supabase } from '../utils/supabaseClient';

const LogoutButton = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      // Optionally, you can add any additional UI updates or redirects here
      console.log('Logged out successfully');
    }
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
};

export default LogoutButton;