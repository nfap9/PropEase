'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import type { RoomFacilities, FacilityItem, FacilityPreset } from '@/types';
import { FURNITURE_PRESETS, APPLIANCE_PRESETS } from '@/lib/constants/facilities';

export interface FacilitySelectorProps {
  /** 当前设施配置 */
  value: RoomFacilities | null;
  /** 配置变更回调 */
  onChange: (value: RoomFacilities | null) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

interface FacilityGroupProps {
  title: string;
  presets: FacilityPreset[];
  items: FacilityItem[];
  onToggle: (code: string, checked: boolean) => void;
  onQuantityChange: (code: string, quantity: number) => void;
  disabled?: boolean;
}

function FacilityGroup({
  title,
  presets,
  items,
  onToggle,
  onQuantityChange,
  disabled,
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
                    disabled={disabled}
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
                      disabled={disabled || quantity <= 1}
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
                      disabled={disabled}
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

export function FacilitySelector({ value, onChange, disabled = false }: FacilitySelectorProps) {
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

    // 如果两个列表都为空，则清空
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">家具家电配置</Label>
        {totalItems > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            清空
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <FacilityGroup
          title="家具"
          presets={FURNITURE_PRESETS}
          items={furniture}
          onToggle={(code, checked) => handleToggle('furniture', code, checked)}
          onQuantityChange={(code, qty) => handleQuantityChange('furniture', code, qty)}
          disabled={disabled}
        />

        <FacilityGroup
          title="家电"
          presets={APPLIANCE_PRESETS}
          items={appliances}
          onToggle={(code, checked) => handleToggle('appliances', code, checked)}
          onQuantityChange={(code, qty) => handleQuantityChange('appliances', code, qty)}
          disabled={disabled}
        />
      </div>

      {totalItems > 0 && (
        <div className="text-sm text-muted-foreground">已选择 {totalItems} 项设施</div>
      )}
    </div>
  );
}
