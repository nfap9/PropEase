
import { LoaderCircle } from 'lucide-react';

interface AuthLoadingScreenProps {
  label?: string;
}

export function AuthLoadingScreen({ label = '加载中...' }: AuthLoadingScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute left-[-7rem] top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-300/10" />

      <div className="relative flex items-center gap-3 rounded-full border border-border/60 bg-card/80 px-5 py-3 text-sm text-muted-foreground shadow-lg backdrop-blur-xl">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
