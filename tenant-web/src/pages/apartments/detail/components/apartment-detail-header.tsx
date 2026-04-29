
import { ArrowLeft, Pencil, Zap } from 'lucide-react';
import { Button } from 'antd';
import type { Apartment } from '@/types';

interface ApartmentDetailHeaderProps {
  apartment: Apartment;
  onBack: () => void;
  onEdit: () => void;
  onOpenConfig?: () => void;
  /** 是否有编辑公寓权限 */
  canEdit?: boolean;
  /** 是否有编辑公寓配置权限 */
  canEditConfig?: boolean;
}

export function ApartmentDetailHeader({
  apartment,
  onBack,
  onEdit,
  onOpenConfig,
  canEdit = true,
  canEditConfig = true,
}: ApartmentDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Button type="text" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{apartment.name}</h1>
          {apartment.address && (
            <p className="text-sm text-gray-500 truncate">{apartment.address}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onOpenConfig && canEditConfig && (
          <Button onClick={onOpenConfig}>
            <Zap className="mr-2 h-4 w-4" />
            公寓配置
          </Button>
        )}
        {canEdit && (
          <Button onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </Button>
        )}
      </div>
    </div>
  );
}
