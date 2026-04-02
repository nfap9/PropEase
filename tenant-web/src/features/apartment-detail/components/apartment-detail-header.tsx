'use client';

import { ArrowLeft, Pencil, Zap } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';

interface ApartmentDetailHeaderProps {
  apartmentName: string;
  onBack: () => void;
  onEdit: () => void;
  onOpenUtilityConfig?: () => void;
}

export function ApartmentDetailHeader({
  apartmentName,
  onBack,
  onEdit,
  onOpenUtilityConfig,
}: ApartmentDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{apartmentName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onOpenUtilityConfig && (
          <Button variant="outline" size="sm" onClick={onOpenUtilityConfig}>
            <Zap className="mr-2 h-4 w-4" />
            水电配置
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>
    </div>
  );
}
