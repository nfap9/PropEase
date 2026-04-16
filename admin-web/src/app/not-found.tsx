import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-2xl font-semibold">未找到</h2>
      <p className="text-center text-muted-foreground">请求的页面不存在</p>
      <Button asChild variant="default">
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  );
}
