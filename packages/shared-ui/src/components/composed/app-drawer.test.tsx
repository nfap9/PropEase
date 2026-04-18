import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppDrawer, CommonDrawer } from './app-drawer';

describe('AppDrawer', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: '测试抽屉',
    children: <p>抽屉内容</p>,
  };

  it('open 为 true 时渲染抽屉', () => {
    render(<AppDrawer {...defaultProps} />);
    expect(screen.getByText('测试抽屉')).toBeInTheDocument();
    expect(screen.getByText('抽屉内容')).toBeInTheDocument();
  });

  it('open 为 false 时不渲染', () => {
    render(<AppDrawer {...defaultProps} open={false} />);
    expect(screen.queryByText('测试抽屉')).not.toBeInTheDocument();
  });

  it('传入 description 时渲染描述', () => {
    render(<AppDrawer {...defaultProps} description="这是描述" />);
    expect(screen.getByText('这是描述')).toBeInTheDocument();
  });

  it('传入 footer 时渲染底部', () => {
    render(
      <AppDrawer {...defaultProps} footer={<button>确认</button>} />
    );
    expect(screen.getByText('确认')).toBeInTheDocument();
  });

  it('点击关闭按钮触发 onOpenChange(false)', () => {
    const onOpenChange = vi.fn();
    render(<AppDrawer {...defaultProps} onOpenChange={onOpenChange} />);

    const closeButton = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('headerAction 渲染在标题右侧', () => {
    render(
      <AppDrawer
        {...defaultProps}
        headerAction={<button>操作</button>}
      />
    );
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('不同 size 渲染不同宽度类', () => {
    const { rerender } = render(
      <AppDrawer {...defaultProps} size="sm" contentTestId="sm-drawer" />
    );
    expect(screen.getByTestId('sm-drawer')).toBeInTheDocument();

    rerender(<AppDrawer {...defaultProps} size="full" contentTestId="full-drawer" />);
    expect(screen.getByTestId('full-drawer')).toBeInTheDocument();
  });

  it('side 为 top 时渲染顶部抽屉', () => {
    render(<AppDrawer {...defaultProps} side="top" />);
    expect(screen.getByText('测试抽屉')).toBeInTheDocument();
  });

  it('side 为 left 时渲染左侧抽屉', () => {
    render(<AppDrawer {...defaultProps} side="left" />);
    expect(screen.getByText('测试抽屉')).toBeInTheDocument();
  });

  it('title 支持 ReactNode', () => {
    render(
      <AppDrawer
        {...defaultProps}
        title={<span data-testid="custom-title">自定义标题</span>}
      />
    );
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });
});

describe('CommonDrawer', () => {
  it('渲染 header 内容', () => {
    render(
      <CommonDrawer
        open={true}
        onOpenChange={vi.fn()}
        header={<div>头部</div>}
        children={<p>内容</p>}
      />
    );
    expect(screen.getByText('头部')).toBeInTheDocument();
  });

  it('渲染 footer 内容', () => {
    render(
      <CommonDrawer
        open={true}
        onOpenChange={vi.fn()}
        footer={<div>底部</div>}
        children={<p>内容</p>}
      />
    );
    expect(screen.getByText('底部')).toBeInTheDocument();
  });

  it('使用自定义 width', () => {
    render(
      <CommonDrawer
        open={true}
        onOpenChange={vi.fn()}
        width="w-96"
        children={<p>内容</p>}
      />
    );
    expect(screen.getByText('内容')).toBeInTheDocument();
  });
});
