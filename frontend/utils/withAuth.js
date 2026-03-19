'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/index';

export default function withAuth(Component, roles = []) {
  return function Protected(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) { router.replace('/login'); return; }
        if (roles.length && !roles.includes(user.role)) router.replace('/dashboard');
      }
    }, [user, loading]);

    if (loading || !user) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-navy-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">Loading...</span>
        </div>
      </div>
    );

    if (roles.length && !roles.includes(user.role)) return null;
    return <Component {...props} />;
  };
}
