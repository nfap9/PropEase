import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@apartment-ultra/shared-ui/components/ui';

function DatePickerHarness() {
  const [value, setValue] = useState('');

  return <DateTimePicker mode="date" value={value} onChange={setValue} placeholder="选择日期" />;
}

function TimePickerHarness() {
  const [value, setValue] = useState('');

  return <DateTimePicker mode="time" value={value} onChange={setValue} placeholder="选择时间" />;
}

function FilledDatePickerHarness() {
  const [value, setValue] = useState('2026-03-15');

  return <DateTimePicker mode="date" value={value} onChange={setValue} placeholder="选择日期" />;
}

function DialogDatePickerHarness() {
  const [value, setValue] = useState('');

  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>测试弹窗</DialogTitle>
        <DialogDescription>验证日期选择器在弹窗内不会触发外部关闭。</DialogDescription>
        <DateTimePicker mode="date" value={value} onChange={setValue} placeholder="弹窗内选择日期" />
      </DialogContent>
    </Dialog>
  );
}

describe('DateTimePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports selecting a calendar day in date mode', async () => {
    const user = userEvent.setup();

    render(<DatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择日期' }));
    const availableDayButtons = await screen.findAllByRole('button');
    const calendarDayButton = availableDayButtons.find((element) => element.textContent === '15');

    expect(calendarDayButton).toBeTruthy();
    await user.click(calendarDayButton!);

    const expectedDate = new Date();
    expectedDate.setDate(15);
    const expectedLabel = format(expectedDate, 'yyyy.MM.dd EEE', { locale: zhCN });

    expect(await screen.findByRole('button', { name: expectedLabel })).toBeInTheDocument();
  });

  it('changes month when navigation buttons are clicked', async () => {
    const user = userEvent.setup();

    render(<DatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择日期' }));
    const panel = document.querySelector('[data-slot="date-time-picker-panel"]') as HTMLElement;
    const currentMonthLabel = `${new Date().getMonth() + 1} 月`;

    expect(within(panel).getByRole('button', { name: currentMonthLabel })).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: '下个月' }));

    expect(within(panel).queryByRole('button', { name: currentMonthLabel })).not.toBeInTheDocument();
  });

  it('supports year to month to day drilldown', async () => {
    const user = userEvent.setup();

    render(<DatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择日期' }));

    const panel = document.querySelector('[data-slot="date-time-picker-panel"]') as HTMLElement;
    const currentYear = new Date().getFullYear();
    const targetYear = currentYear + 2;

    await user.click(within(panel).getByRole('button', { name: `${currentYear} 年` }));
    await user.click(within(panel).getByRole('button', { name: String(targetYear) }));
    await user.click(within(panel).getByRole('button', { name: '12 月' }));

    expect(within(panel).getByRole('button', { name: `${targetYear} 年` })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '12 月' })).toBeInTheDocument();
  });

  it('opens month selection when clicking the month label', async () => {
    const user = userEvent.setup();

    render(<DatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择日期' }));

    const panel = document.querySelector('[data-slot="date-time-picker-panel"]') as HTMLElement;
    const currentMonthLabel = `${new Date().getMonth() + 1} 月`;

    await user.click(within(panel).getByRole('button', { name: currentMonthLabel }));

    expect(within(panel).getByRole('button', { name: '1 月' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '12 月' })).toBeInTheDocument();
  });

  it('supports quick time presets in time mode', async () => {
    const user = userEvent.setup();

    render(<TimePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择时间' }));
    await user.click(await screen.findByRole('button', { name: '18:00' }));

    expect(await screen.findByRole('button', { name: '18:00' })).toBeInTheDocument();
  });

  it('clears value from the trigger clear icon without opening the panel', async () => {
    const user = userEvent.setup();

    render(<FilledDatePickerHarness />);

    await user.hover(screen.getByRole('button', { name: /2026\.03\.15/ }));
    await user.click(screen.getByRole('button', { name: '清空日期' }));

    expect(screen.getByRole('button', { name: '选择日期' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="date-time-picker-panel"]')).toBeNull();
  });

  it('keeps parent dialog open while selecting inside the panel', async () => {
    const user = userEvent.setup();

    render(<DialogDatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '弹窗内选择日期' }));
    const availableDayButtons = await screen.findAllByRole('button');
    const calendarDayButton = availableDayButtons.find((element) => element.textContent === '15');

    expect(calendarDayButton).toBeTruthy();
    await user.click(calendarDayButton!);

    expect(screen.getByText('测试弹窗')).toBeInTheDocument();

    const expectedDate = new Date();
    expectedDate.setDate(15);
    const expectedLabel = format(expectedDate, 'yyyy.MM.dd EEE', { locale: zhCN });
    expect(await screen.findByRole('button', { name: expectedLabel })).toBeInTheDocument();
  });

  it('keeps the panel within the viewport bounds', async () => {
    const user = userEvent.setup();
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 700,
    });

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockRect(this: HTMLElement) {
        if (this.getAttribute('data-slot') === 'date-time-picker-root') {
          return {
            x: 300,
            y: 600,
            width: 120,
            height: 40,
            top: 600,
            right: 420,
            bottom: 640,
            left: 300,
            toJSON: () => ({}),
          } as DOMRect;
        }

        if (this.getAttribute('data-slot') === 'date-time-picker-trigger') {
          return {
            x: 320,
            y: 620,
            width: 120,
            height: 40,
            top: 620,
            right: 440,
            bottom: 660,
            left: 320,
            toJSON: () => ({}),
          } as DOMRect;
        }

        return {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });

    render(<DatePickerHarness />);

    await user.click(screen.getByRole('button', { name: '选择日期' }));

    const panelElement = document.querySelector('[data-slot="date-time-picker-panel"]') as HTMLElement | null;

    expect(panelElement).not.toBeNull();
    expect(panelElement?.style.left).toBe('-214px');
    expect(panelElement?.style.top).toBe('-292px');
    expect(panelElement?.className).toContain('absolute');
    expect(panelElement?.getAttribute('data-side')).toBe('top');

    rectSpy.mockRestore();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });
});
