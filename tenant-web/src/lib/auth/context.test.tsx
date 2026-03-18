import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context';

const { getMeMock, listOrganizationsMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  listOrganizationsMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  authApi: {
    getMe: getMeMock,
    login: vi.fn(),
  },
  organizationsApi: {
    list: listOrganizationsMock,
  },
}));

function TestConsumer() {
  const { organization, organizations, isLoading, refreshOrganizations } = useAuth();

  if (isLoading) {
    return <div>loading</div>;
  }

  return (
    <div>
      <div data-testid="organization-name">{organization?.name ?? 'none'}</div>
      <div data-testid="organization-count">{organizations.length}</div>
      <button type="button" onClick={() => void refreshOrganizations()}>
        refresh
      </button>
    </div>
  );
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('AuthProvider', () => {
  it('auto-selects the first organization after refreshing from an empty state', async () => {
    const firstOrg = {
      id: 'org-1',
      name: '测试组织',
      slug: 'test-org',
      settings: {},
      is_personal: false,
      created_at: '2026-03-17T00:00:00.000Z',
    };

    const getItemMock = vi.mocked(localStorage.getItem);

    getItemMock.mockImplementation((key: string) => {
      if (key === 'access_token') {
        return 'token';
      }
      return null;
    });

    getMeMock.mockResolvedValue({
      id: 'user-1',
      phone: '13800000000',
      full_name: '测试用户',
      created_at: '2026-03-17T00:00:00.000Z',
      updated_at: '2026-03-17T00:00:00.000Z',
    });
    listOrganizationsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([firstOrg]);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('organization-name')).toHaveTextContent('none');
      expect(screen.getByTestId('organization-count')).toHaveTextContent('0');
    });

    await userEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('organization-name')).toHaveTextContent('测试组织');
      expect(screen.getByTestId('organization-count')).toHaveTextContent('1');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('current_organization_id', 'org-1');
  });
});
