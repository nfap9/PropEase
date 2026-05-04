import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { Card } from 'antd';

type AuthMode = 'login' | 'register';

interface AuthShellProps {
  mode: AuthMode;
  app_name: string;
  form_title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const SHELL_COPY: Record<
  AuthMode,
  {
    title: string;
  }
> = {
  login: {
    title: '把房源、租客与账单重新放回一个顺手的工作台里。',
  },
  register: {
    title: '为你的公寓业务搭一个更完整、更好用的运营起点。',
  },
};

export function AuthShell({ mode, app_name, form_title, children, footer }: AuthShellProps) {
  const shellCopy = SHELL_COPY[mode];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-300/10" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-center">
          <section className="relative hidden p-6 sm:p-8 lg:block lg:p-10">
            <div className="relative max-w-xl">
              <div className="absolute -left-8 -top-4 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl" />
              <div className="relative">
                <p className="text-sm font-medium uppercase tracking-[0.08em] text-foreground/50">
                  {app_name}
                </p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.4rem] lg:leading-[1.08] lg:bg-gradient-to-r lg:from-foreground/80 lg:to-foreground/40 lg:bg-clip-text lg:text-transparent lg:drop-shadow-sm">
                  {shellCopy.title}
                </h1>
              </div>
            </div>
          </section>

          <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center lg:min-h-0 lg:justify-end">
            <Card
              className="w-full max-w-md rounded-[32px] border border-border/60 bg-card/70 shadow-2xl backdrop-blur-2xl dark:bg-card/50"
              styles={{ body: { padding: 0 } }}
            >
              <div className="space-y-1 px-5 pb-0 pt-6 sm:px-6 lg:space-y-2 lg:pb-6 lg:pt-6">
                <p className="text-sm font-medium uppercase tracking-[0.08em] text-foreground/60 lg:hidden">
                  {app_name}
                </p>
                <h2 className="text-2xl font-semibold text-foreground sm:text-[1.85rem]">{form_title}</h2>
              </div>

              <div className="space-y-6 px-5 sm:px-6">{children}</div>

              {footer ? (
                <div className="mt-4 border-t border-border/70 px-5 pb-5 pt-5 text-sm text-muted-foreground sm:px-6 sm:pb-6">
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
