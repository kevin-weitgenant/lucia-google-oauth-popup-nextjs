import { useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    const popup = window.open(
      '/login/google',
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        setUser(event.data.user);
        popup?.close();
      }
    });
  };

  return (
    <main>
      <h1>Welcome to our app</h1>
      {user ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={handleGoogleLogin}>Login with Google</button>
      )}
    </main>
  );
}
