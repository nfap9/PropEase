
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Skeleton } from 'antd';
import { useAuth } from '@/contexts/auth';
import { Building2 } from 'lucide-react';

import { RoomsStatsBar } from '@/pages/rooms/components/rooms-stats-bar';
import { RoomsSearchBar } from '@/pages/rooms/components/rooms-search-bar';
import { RoomsViewToggle } from '@/pages/rooms/components/rooms-view-toggle';
import { RoomsGroupedView } from '@/pages/rooms/components/rooms-grouped-view';
import { LeaseSigningDrawer } from '@/pages/leases/components/lease-signing-drawer';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import { TerminateDialog } from '@/pages/rooms/components/terminate-dialog';
import { useRoomsPage } from './hooks/use-rooms-page';

export default function RoomsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const {
    allRooms,
    apartments,
    leases,
    roomsLoading,
    apartmentsLoading,
    filters,
    searchQuery,
    viewMode,
    isLeaseOpen,
    pendingInitialReading,
    isTerminateOpen,
    selectedRoom,
    groupedRooms,
    terminateLeaseMutation,
    updateStatusMutation,
    handleLease,
    handleTerminate,
    handleStatusChange,
    handleFilterChange,
    setSearchQuery,
    handleClearFilters,
    handleLeaseSuccess,
    closeLeaseDrawer,
    closeTerminateDialog,
    setViewMode,
    getActiveLease,
    setPendingInitialReading,
    setLeaseOpen,
  } = useRoomsPage();

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  const isLoading = roomsLoading || apartmentsLoading;

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
        {allRooms && <RoomsStatsBar rooms={allRooms} />}

        {apartments && apartments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <RoomsSearchBar
              apartments={apartments}
              filters={filters}
              search={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <RoomsViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <RoomsGroupedView
            groups={groupedRooms}
            viewMode={viewMode}
            onLease={handleLease}
            onTerminate={handleTerminate}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      <LeaseSigningDrawer
        orgId={orgId}
        open={isLeaseOpen}
        onOpenChange={setLeaseOpen}
        room={selectedRoom}
        onSuccess={handleLeaseSuccess}
        onLeaseCreated={setPendingInitialReading}
      />

      {pendingInitialReading && (
        <InitialReadingDialog
          orgId={orgId}
          roomId={pendingInitialReading.room_id}
          roomDisplay={pendingInitialReading.room_display}
          startDate={pendingInitialReading.start_date}
          isHistoricalLeaseEntry={pendingInitialReading.is_historical_entry}
          open={!!pendingInitialReading}
          onOpenChange={(open) => !open && setPendingInitialReading(null)}
          onSuccess={() => setPendingInitialReading(null)}
        />
      )}

      <TerminateDialog
        open={isTerminateOpen}
        onOpenChange={closeTerminateDialog}
        onConfirm={() => {
          if (selectedRoom) {
            const activeLease = getActiveLease(selectedRoom.id);
            if (activeLease) {
              terminateLeaseMutation.mutate(activeLease.id);
            }
          }
        }}
        isPending={terminateLeaseMutation.isPending}
        room={selectedRoom}
      />
    </PermissionPageGuard>
  );
}
