import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InitialReadingDialog } from './initial-reading-dialog';

const { createMock, invalidateQueriesMock, successMock, errorMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn(),
}));

vi.mock('@/api', () => ({
  utilitiesApi: {
    create: createMock,
  },
}));

function renderDialog(props?: Partial<React.ComponentProps<typeof InitialReadingDialog>>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(invalidateQueriesMock);

  return render(
    <QueryClientProvider client={queryClient}>
      <InitialReadingDialog
        orgId="org-1"
        roomId="room-1"
        roomDisplay="A座 101"
        startDate="2026-03-15"
        open
        onOpenChange={() => {}}
        {...props}
      />
    </QueryClientProvider>
  );
}

describe('InitialReadingDialog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits the form when clicking save from the dialog footer', async () => {
    createMock.mockResolvedValue({
      id: 'reading-1',
      room_id: 'room-1',
      period_year: 2026,
      period_month: 3,
      reading_date: '2026-03-15',
      water_reading: 123,
      electricity_reading: null,
      water_previous: 123,
      electricity_previous: null,
      notes: null,
      created_at: '2026-03-15T00:00:00.000Z',
    });

    renderDialog();

    await userEvent.type(screen.getByLabelText('水表读数 (m³)'), '123');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          room_id: 'room-1',
          period_year: 2026,
          period_month: 3,
          reading_date: '2026-03-15',
          water_reading: 123,
        })
      );
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['utilities', 'org-1'] });
    expect(successMock).toHaveBeenCalledWith('初始水电读数已录入');
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('defaults reading date to today and shows the historical lease hint', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));

    renderDialog({ isHistoricalLeaseEntry: true });

    expect(screen.getByLabelText('读数日期')).toHaveValue('2026-03-29');
    expect(screen.getByRole('link', { name: '历史水电记录' })).toHaveAttribute('href', '/utilities?tab=history');
    expect(screen.getByText((content) => content.includes('历史租约已创建，建议先记录当前表底数。'))).toBeInTheDocument();
  });
});
