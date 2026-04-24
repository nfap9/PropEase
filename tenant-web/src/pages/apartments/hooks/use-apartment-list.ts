import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';

export function useApartmentList(searchQuery: string) {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: apartments, isLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const filteredApartments = useMemo(() => {
    if (!apartments) return undefined;
    if (!searchQuery) return apartments;
    const query = searchQuery.toLowerCase();
    return apartments.filter(
      (apt) =>
        apt.name.toLowerCase().includes(query) ||
        (apt.address?.toLowerCase().includes(query) ?? false),
    );
  }, [apartments, searchQuery]);

  return { apartments, filteredApartments, isLoading };
}
