
import { ArrowLeft, Pencil, Zap } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { Apartment } from '@/types';

interface ApartmentDetailHeaderProps {
  apartment: Apartment;
  onBack: () => void;
  onEdit: () => void;
  onOpenUtilityConfig?: () => void;
}

export function ApartmentDetailHeader({
  apartment,
  onBack,
  onEdit,
  onOpenUtilityConfig,
}: ApartmentDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{apartment.name}</h1>
          {apartment.address && (
            <p className="text-sm text-muted-foreground truncate">{apartment.address}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
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
