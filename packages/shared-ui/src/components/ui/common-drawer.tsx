'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { sheetVariants } from './sheet';

/**
 * 通用抽屉组件
 * - 顶部 header 固定不滚动
 * - 底部 footer 固定不滚动
 * - 中间内容区域可滚动
 * - 默认宽度 50%
 */
interface CommonDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side: 'right' }), className)} {...props}>
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">关闭</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export function CommonDrawer({
  open,
  onOpenChange,
  header,
  footer,
  children,
  width = 'w-full sm:w-[50%]',
  className,
}: CommonDrawerProps) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('flex flex-col h-screen p-0', width, className)}>
        {/* 固定头部 */}
        {header && (
          <div className="flex-shrink-0 sticky top-0 z-10 bg-background px-6 py-4 border-b">
            {header}
          </div>
        )}

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* 固定底部 */}
        {footer && (
          <div className="flex-shrink-0 sticky bottom-0 z-10 bg-background px-6 py-4 border-t">
            {footer}
          </div>
        )}
      </SheetContent>
    </SheetPrimitive.Root>
  );
}
