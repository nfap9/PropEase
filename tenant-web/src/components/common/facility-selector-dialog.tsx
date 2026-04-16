
import { useState } from 'react';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import type { RoomFacilities, FacilityItem, FacilityPreset } from '@/types';
import { FURNITURE_PRESETS, APPLIANCE_PRESETS } from '@/constants/facilities';

export interface FacilitySelectorDialogProps {
  /** 当前设施配置 */
  value: RoomFacilities | null;
  /** 配置变更回调 */
  onChange: (value: RoomFacilities | null) => void;
  /** 是否打开 */
  open: boolean;
  /** 打开状态变更 */
  onOpenChange: (open: boolean) => void;
}

interface FacilityGroupProps {
  title: string;
  presets: FacilityPreset[];
  items: FacilityItem[];
  onToggle: (code: string, checked: boolean) => void;
  onQuantityChange: (code: string, quantity: number) => void;
}

function FacilityGroup({
  title,
  presets,
  items,
  onToggle,
  onQuantityChange,
}: FacilityGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const itemCount = items.length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{title}</span>
        <span className="text-muted-foreground">({itemCount})</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 pl-6">
          {presets.map((preset) => {
            const item = items.find((i) => i.code === preset.code);
            const isChecked = !!item;
            const quantity = item?.quantity ?? preset.default_quantity;

            return (
              <div
                key={preset.code}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`facility-${preset.code}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => onToggle(preset.code, checked === true)}
                  />
                  <Label
                    htmlFor={`facility-${preset.code}`}
                    className="cursor-pointer text-sm"
                  >
                    {preset.label}
                  </Label>
                </div>

                {isChecked && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onQuantityChange(preset.code, Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onQuantityChange(preset.code, quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FacilitySelectorDialog({
  value,
  onChange,
  open,
  onOpenChange,
}: FacilitySelectorDialogProps) {
  const furniture = value?.furniture ?? [];
  const appliances = value?.appliances ?? [];

  const handleToggle = (
    category: 'furniture' | 'appliances',
    code: string,
    checked: boolean
  ) => {
    const currentList = category === 'furniture' ? furniture : appliances;
    const presets = category === 'furniture' ? FURNITURE_PRESETS : APPLIANCE_PRESETS;
    const preset = presets.find((p) => p.code === code);

    let newList: FacilityItem[];
    if (checked) {
      newList = [...currentList, { code, quantity: preset?.default_quantity ?? 1 }];
    } else {
      newList = currentList.filter((i) => i.code !== code);
    }

    const newValue: RoomFacilities = {
      version: 1,
      furniture: category === 'furniture' ? newList : furniture,
      appliances: category === 'appliances' ? newList : appliances,
    };

    if (newValue.furniture.length === 0 && newValue.appliances.length === 0) {
      onChange(null);
    } else {
      onChange(newValue);
    }
  };

  const handleQuantityChange = (
    category: 'furniture' | 'appliances',
    code: string,
    quantity: number
  ) => {
    const currentList = category === 'furniture' ? furniture : appliances;
    const newList = currentList.map((i) => (i.code === code ? { ...i, quantity } : i));

    onChange({
      version: 1,
      furniture: category === 'furniture' ? newList : furniture,
      appliances: category === 'appliances' ? newList : appliances,
    });
  };

  const handleClear = () => {
    onChange(null);
  };

  const totalItems = furniture.length + appliances.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>家具家电配置</DialogTitle>
          <DialogDescription>选择房间配备的家具家电</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              已选择 {totalItems} 项设施
            </span>
            {totalItems > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                清空
              </Button>
            )}
          </div>

          <FacilityGroup
            title="家具"
            presets={FURNITURE_PRESETS}
            items={furniture}
            onToggle={(code, checked) => handleToggle('furniture', code, checked)}
            onQuantityChange={(code, qty) => handleQuantityChange('furniture', code, qty)}
          />

          <FacilityGroup
            title="家电"
            presets={APPLIANCE_PRESETS}
            items={appliances}
            onToggle={(code, checked) => handleToggle('appliances', code, checked)}
            onQuantityChange={(code, qty) => handleQuantityChange('appliances', code, qty)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
