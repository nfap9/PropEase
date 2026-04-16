
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-semibold">出错了</h2>
      <p className="text-center text-muted-foreground">{error.message || '发生了未知错误'}</p>
      <Button onClick={reset} variant="default">
        重试
      </Button>
    </div>
  );
}
