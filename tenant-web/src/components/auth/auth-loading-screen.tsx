'use client';

import { LoaderCircle } from 'lucide-react';

interface AuthLoadingScreenProps {
  label?: string;
}

export function AuthLoadingScreen({ label = '加载中...' }: AuthLoadingScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_26%),linear-gradient(135deg,_#eff6ff_0%,_#f8fafc_46%,_#e0ecff_100%)] px-4">
      <div className="absolute left-[-7rem] top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative flex items-center gap-3 rounded-full border border-white/70 bg-white/82 px-5 py-3 text-sm text-slate-600 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
