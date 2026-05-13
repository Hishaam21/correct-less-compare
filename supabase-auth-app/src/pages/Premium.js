import React from 'react';
import { useEffect } from 'react';
import { useSupabase } from '../utils/supabaseClient';

const Premium = () => {
  const { user, session } = useSupabase();

  useEffect(() => {
    if (!user) {
      window.location.href = '/'; // Redirect to home if not logged in
    }
  }, [user]);

  return (
    <div className="premium-container">
      <h1>Premium Features</h1>
      {session ? (
        <div>
          <p>Welcome to the premium section, {user.email}!</p>
          <p>Here you can access exclusive content and features.</p>
        </div>
      ) : (
        <p>Please log in to access premium features.</p>
      )}
    </div>
  );
};

export default Premium;