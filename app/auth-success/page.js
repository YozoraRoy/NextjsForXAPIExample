'use client';
import { useEffect, useState } from 'react';

export default function AuthSuccess() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 驗證認證
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/twitter/auth/verify');
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError(error.message);
      }
    };

    verifyAuth();
  }, []);

  if (error) {
    return <div>認證失敗: {error}</div>;
  }

  if (!user) {
    return <div>載入中...</div>;
  }

  return (
    <div>
      <h1>認證成功！</h1>
      <p>歡迎, {user.name}</p>
      <p>Twitter ID: {user.id}</p>
      <p>Screen Name: {user.screen_name}</p>
    </div>
  );
} 