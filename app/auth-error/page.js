'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthError() {
  const router = useRouter();

  useEffect(() => {
    // 短暫延遲後重定向到首頁
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-red-500">認證失敗</h1>
      <p>無法完成 Twitter 認證，請稍後再試。</p>
      <p className="mt-4">正在返回首頁...</p>
    </div>
  );
} 