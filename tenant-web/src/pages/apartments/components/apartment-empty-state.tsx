
import { Building2, Search } from 'lucide-react';
import { Card } from 'antd';
import { Button } from 'antd';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';

interface ApartmentEmptyStateProps {
  hasApartments: boolean;
  onCreateClick: () => void;
}

export function ApartmentEmptyState({ hasApartments, onCreateClick }: ApartmentEmptyStateProps) {
  if (hasApartments) {
    return (
      <Card className="border-dashed" data-testid="apartments-empty-state" styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' } }}>
        <Search className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">未找到匹配的公寓</h3>
        <p className="text-sm text-muted-foreground">尝试使用其他关键词搜索</p>
      </Card>
    );
  }

  return (
    <Card className="border-dashed" data-testid="apartments-empty-state" styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' } }}>
      <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">暂无公寓</h3>
      <p className="mb-4 text-sm text-muted-foreground">点击下方按钮添加您的第一个公寓</p>
      <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
        <Button
          onClick={onCreateClick}
          aria-label="新增公寓（空状态）"
          data-testid="apartments-new-btn"
        >
          新增公寓
        </Button>
      </PermissionGuard>
    </Card>
  );
}
