'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/index';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) router.replace(user ? '/dashboard' : '/login'); }, [user, loading]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
      <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
