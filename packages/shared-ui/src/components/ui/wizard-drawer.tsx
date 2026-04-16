
import * as React from 'react';

import { cn } from '../../lib/utils';
import { AppDrawer, type AppDrawerProps } from './app-drawer';
import { Button } from './button';

type WizardDrawerSize = Extract<NonNullable<AppDrawerProps['size']>, 'md' | 'lg' | 'xl'>;

export interface WizardDrawerStep {
  /** 步骤唯一标识，建议在业务层保持稳定。 */
  id: string;
  /** 步骤图标。 */
  icon?: React.ReactNode;
  /** 步骤标题。 */
  title: React.ReactNode;
  /** 步骤补充说明。 */
  description?: React.ReactNode;
}

export interface WizardDrawerProps {
  /** 是否打开，对应受控模式。 */
  open: boolean;
  /** 抽屉开关回调。 */
  onOpenChange: (open: boolean) => void;
  /** 抽屉标题。 */
  title: React.ReactNode;
  /** 抽屉说明。 */
  description?: React.ReactNode;
  /** 步骤列表。 */
  steps: readonly WizardDrawerStep[];
  /** 当前步骤索引，从 0 开始。 */
  currentStep: number;
  /** 当前步骤主体内容。 */
  children: React.ReactNode;
  /** 点击“下一步”时触发。 */
  onNext?: () => void;
  /** 点击“上一步”时触发。 */
  onPrevious?: () => void;
  /** 点击“完成”时触发。 */
  onComplete?: () => void;
  /** 下一步按钮文案。 */
  nextLabel?: React.ReactNode;
  /** 上一步按钮文案。 */
  previousLabel?: React.ReactNode;
  /** 完成按钮文案。 */
  completeLabel?: React.ReactNode;
  /** 是否禁用“下一步”按钮。 */
  nextDisabled?: boolean;
  /** 是否禁用“上一步”按钮。 */
  previousDisabled?: boolean;
  /** 是否禁用“完成”按钮。 */
  completeDisabled?: boolean;
  /** 是否处于提交中。 */
  isPending?: boolean;
  /** 底部额外操作区。 */
  footerExtra?: React.ReactNode;
  /** 抽屉尺寸。 */
  size?: WizardDrawerSize;
  /** 内容容器类名。 */
  className?: string;
  /** 内容容器测试 id。 */
  contentTestId?: string;
  /** 主体类名。 */
  bodyClassName?: string;
  /** 步骤导航区类名。 */
  stepsClassName?: string;
}

/**
 * 多步骤向导抽屉。
 *
 * 适用于步骤顺序稳定、需要统一步骤头和底部导航的复杂录入流程。
 * 共享层只负责外壳与导航语义，不接管表单、校验和提交流程。
 */
export function WizardDrawer({
  open,
  onOpenChange,
  title,
  description,
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  onComplete,
  nextLabel = '下一步',
  previousLabel = '上一步',
  completeLabel = '完成',
  nextDisabled = false,
  previousDisabled = false,
  completeDisabled = false,
  isPending = false,
  footerExtra,
  size = 'lg',
  className,
  contentTestId,
  bodyClassName,
  stepsClassName,
}: WizardDrawerProps) {
  const safeStepIndex = Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0));
  const isFirstStep = safeStepIndex === 0;
  const isLastStep = safeStepIndex === steps.length - 1;

  const footer = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>{footerExtra}</div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          取消
        </Button>
        <Button type="button" variant="outline" onClick={onPrevious} disabled={isFirstStep || previousDisabled || isPending}>
          {previousLabel}
        </Button>
        {isLastStep ? (
          <Button type="button" onClick={onComplete} disabled={completeDisabled || isPending}>
            {completeLabel}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} disabled={nextDisabled || isPending}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      size={size}
      className={className}
      contentTestId={contentTestId}
      bodyClassName={cn('space-y-6', bodyClassName)}
    >
      <div className={cn('rounded-2xl border border-border/70 bg-muted/35 px-4 py-5', stepsClassName)}>
        <div className="flex items-start overflow-x-auto pb-1">
          {steps.map((step, index) => {
            const isCompleted = index < safeStepIndex;
            const isActive = index === safeStepIndex;
            const isConnectorCompleted = index < safeStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex min-w-[112px] flex-1 flex-col items-center text-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      isActive && 'border-primary/50 bg-primary/10 text-primary',
                      !isCompleted && !isActive && 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {step.icon ?? index + 1}
                  </div>
                  <p
                    className={cn(
                      'mt-3 w-full truncate text-sm font-medium',
                      isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1 w-full truncate text-xs text-muted-foreground">{step.description ?? '\u00A0'}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div className="mt-5 flex flex-1 items-center px-2">
                    <div
                      className={cn(
                        'h-px w-full rounded-full transition-colors',
                        isConnectorCompleted ? 'bg-primary/45' : 'bg-border'
                      )}
                    />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {children}
    </AppDrawer>
  );
}
