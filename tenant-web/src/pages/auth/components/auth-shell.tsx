
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Button } from 'antd';
import { Tag } from 'antd';
import { Card } from 'antd';
import { cn } from '@apartment-ultra/web-shared';

type AuthMode = 'login' | 'register';

interface AuthShellProps {
  mode: AuthMode;
  app_name: string;
  app_description: string;
  form_title: string;
  form_description: string;
  children: ReactNode;
  footer?: ReactNode;
}

const SHELL_COPY: Record<
  AuthMode,
  {
    badge: string;
    title: string;
    description: string;
    note: string;
  }
> = {
  login: {
    badge: '工作台入口',
    title: '把房源、租客与账单重新放回一个顺手的工作台里。',
    description: '从今天的待办到历史台账，所有高频动作都应该一眼找到、一步进入。',
    note: '清楚一点，顺手一点，每天都会更省心一点。',
  },
  register: {
    badge: '快速开始',
    title: '为你的公寓业务搭一个更完整、更好用的运营起点。',
    description: '注册后即可进入系统，把团队协作、房源管理和账单处理放到同一个节奏里。',
    note: '从第一天开始，就让流程和信息保持整洁。',
  },
};

export function AuthShell({
  mode,
  app_name,
  app_description,
  form_title,
  form_description,
  children,
  footer,
}: AuthShellProps) {
  const shellCopy = SHELL_COPY[mode];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-300/10" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:items-center">
          <section className="relative p-6 sm:p-8 lg:p-10">
            <div className="relative flex h-full flex-col">
              <Tag className="w-fit rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase" color="primary">
                {shellCopy.badge}
              </Tag>

              <div className="mt-8 max-w-xl lg:mt-14">
                <p className="text-sm font-medium tracking-[0.08em] text-foreground/60 uppercase">{app_name}</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-[3.4rem] lg:leading-[1.08]">
                  {shellCopy.title}
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                  {shellCopy.description}
                </p>
              </div>

              <div className="mt-10 max-w-md">
                <p className="text-xs font-medium tracking-[0.16em] text-primary/80 uppercase">Slogan</p>
                <p className="mt-3 text-base font-medium leading-7 text-muted-foreground">{shellCopy.note}</p>
              </div>

              <div className="mt-auto hidden pt-10 lg:block">
                <p className="max-w-sm text-sm leading-7 text-muted-foreground">{app_description}</p>
              </div>
            </div>
          </section>

          <section className="flex items-center lg:justify-end">
            <Card className="w-full max-w-xl rounded-[32px] border border-border/60 bg-card/70 shadow-2xl backdrop-blur-2xl dark:bg-card/50" styles={{ body: { padding: 0 } }}>
              <div className="space-y-6 pb-6">
                <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 p-1">
                  <Link to="/login">
                    <Button
                      size="small"
                      type={mode === 'login' ? 'primary' : 'text'}
                      className={cn(
                        'rounded-full px-4 shadow-none',
                        mode === 'login' && 'bg-background text-foreground shadow-sm hover:bg-background'
                      )}
                    >
                      登录
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="small"
                      type={mode === 'register' ? 'primary' : 'text'}
                      className={cn(
                        'rounded-full px-4 shadow-none',
                        mode === 'register' && 'bg-background text-foreground shadow-sm hover:bg-background'
                      )}
                    >
                      注册
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2 px-5 sm:px-6">
                  <h2 className="text-2xl font-semibold text-foreground sm:text-[1.85rem]">{form_title}</h2>
                  <p className="max-w-lg text-sm leading-7 text-muted-foreground">{form_description}</p>
                </div>
              </div>

              <div className="space-y-6 px-5 sm:px-6">{children}</div>

              {footer ? (
                <div className="border-t border-border/70 px-5 pb-5 pt-5 text-sm text-muted-foreground sm:px-6 sm:pb-6">
                  {footer}
                </div>
              ) : null}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
