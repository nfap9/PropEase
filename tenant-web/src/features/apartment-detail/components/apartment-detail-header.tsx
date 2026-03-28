'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';

interface ApartmentDetailHeaderProps {
  apartmentName: string;
  apartmentAddress?: string | null;
  onBack: () => void;
  onEdit: () => void;
}

export function ApartmentDetailHeader({
  apartmentName,
  apartmentAddress,
  onBack,
  onEdit,
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
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="mr-2 h-4 w-4" />
        编辑
      </Button>
    </div>
  );
}
