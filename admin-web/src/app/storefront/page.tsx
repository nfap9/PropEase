'use client';

import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui';
import type {
  StorefrontConfig,
  StorefrontItem,
  StorefrontItemCreate,
  StorefrontItemUpdate,
} from '@/lib/api/admin-client';
import { createStorefrontColumns, createStorefrontItemColumns } from '@/features/storefront/storefront.columns';
import { useStorefrontData } from '@/features/storefront/storefront.hooks';
import {
  StorefrontDeleteDialog,
  StorefrontFormDialog,
  StorefrontItemDeleteDialog,
  StorefrontItemFormDialog,
} from '@/features/storefront/components/storefront-dialogs';
import { StorefrontItemsView } from '@/features/storefront/components/storefront-items-view';
import { StorefrontListView } from '@/features/storefront/components/storefront-list-view';

export default function StorefrontPage() {
  const [isCreateStorefrontOpen, setIsCreateStorefrontOpen] = useState(false);
  const [isEditStorefrontOpen, setIsEditStorefrontOpen] = useState(false);
  const [isDeleteStorefrontOpen, setIsDeleteStorefrontOpen] = useState(false);
  const [selectedStorefront, setSelectedStorefront] = useState<StorefrontConfig | null>(null);

  const [selectedStorefrontForItems, setSelectedStorefrontForItems] = useState<StorefrontConfig | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorefrontItem | null>(null);

  const {
    storefronts,
    storefrontsLoading,
    serviceProducts,
    storefrontDetail,
    createStorefrontMutation,
    updateStorefrontMutation,
    deleteStorefrontMutation,
    addItemMutation,
    updateItemMutation,
    deleteItemMutation,
  } = useStorefrontData({
    selectedStorefrontForItems,
    onStorefrontCreated: () => setIsCreateStorefrontOpen(false),
    onStorefrontUpdated: () => {
      setIsEditStorefrontOpen(false);
      setSelectedStorefront(null);
    },
    onStorefrontDeleted: () => {
      setIsDeleteStorefrontOpen(false);
      setSelectedStorefront(null);
    },
    onItemCreated: () => setIsAddItemOpen(false),
    onItemUpdated: () => {
      setIsEditItemOpen(false);
      setSelectedItem(null);
    },
    onItemDeleted: () => {
      setIsDeleteItemOpen(false);
      setSelectedItem(null);
    },
  });

  const storefrontColumns = useMemo(
    () =>
      createStorefrontColumns({
        onManageItems: setSelectedStorefrontForItems,
        onEdit: (storefront) => {
          setSelectedStorefront(storefront);
          setIsEditStorefrontOpen(true);
        },
        onDelete: (storefront) => {
          setSelectedStorefront(storefront);
          setIsDeleteStorefrontOpen(true);
        },
      }),
    []
  );

  const storefrontItemColumns = useMemo(
    () =>
      createStorefrontItemColumns({
        onEdit: (item) => {
          setSelectedItem(item);
          setIsEditItemOpen(true);
        },
        onDelete: (item) => {
          setSelectedItem(item);
          setIsDeleteItemOpen(true);
        },
      }),
    []
  );

  if (storefrontsLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {selectedStorefrontForItems ? (
        <StorefrontItemsView
          storefront={selectedStorefrontForItems}
          items={storefrontDetail?.items ?? []}
          columns={storefrontItemColumns}
          onBack={() => {
            setSelectedStorefrontForItems(null);
            setSelectedItem(null);
          }}
          onAddItem={() => {
            setSelectedItem(null);
            setIsAddItemOpen(true);
          }}
        />
      ) : (
        <StorefrontListView
          storefronts={storefronts ?? []}
          columns={storefrontColumns}
          onCreate={() => setIsCreateStorefrontOpen(true)}
        />
      )}

      <StorefrontFormDialog
        mode="create"
        open={isCreateStorefrontOpen}
        onOpenChange={setIsCreateStorefrontOpen}
        onSubmit={(data) => createStorefrontMutation.mutate(data)}
        isPending={createStorefrontMutation.isPending}
      />

      <StorefrontFormDialog
        mode="edit"
        open={isEditStorefrontOpen}
        onOpenChange={setIsEditStorefrontOpen}
        storefront={selectedStorefront}
        onSubmit={(data) => {
          if (!selectedStorefront) {
            return;
          }
          updateStorefrontMutation.mutate({
            storefrontId: selectedStorefront.id,
            data,
          });
        }}
        isPending={updateStorefrontMutation.isPending}
      />

      <StorefrontDeleteDialog
        open={isDeleteStorefrontOpen}
        onOpenChange={setIsDeleteStorefrontOpen}
        storefront={selectedStorefront}
        onConfirm={() => selectedStorefront && deleteStorefrontMutation.mutate(selectedStorefront.id)}
        isPending={deleteStorefrontMutation.isPending}
      />

      <StorefrontItemFormDialog
        mode="create"
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        storefront={selectedStorefrontForItems}
        serviceProducts={serviceProducts}
        onSubmit={(data: StorefrontItemCreate) => {
          if (!selectedStorefrontForItems) {
            return;
          }
          addItemMutation.mutate({
            storefrontId: selectedStorefrontForItems.id,
            data,
          });
        }}
        isPending={addItemMutation.isPending}
      />

      <StorefrontItemFormDialog
        mode="edit"
        open={isEditItemOpen}
        onOpenChange={setIsEditItemOpen}
        storefront={selectedStorefrontForItems}
        item={selectedItem}
        serviceProducts={serviceProducts}
        onSubmit={(data: StorefrontItemUpdate) => {
          if (!selectedStorefrontForItems || !selectedItem) {
            return;
          }
          updateItemMutation.mutate({
            storefrontId: selectedStorefrontForItems.id,
            itemId: selectedItem.id,
            data,
          });
        }}
        isPending={updateItemMutation.isPending}
      />

      <StorefrontItemDeleteDialog
        open={isDeleteItemOpen}
        onOpenChange={setIsDeleteItemOpen}
        item={selectedItem}
        onConfirm={() => {
          if (!selectedStorefrontForItems || !selectedItem) {
            return;
          }
          deleteItemMutation.mutate({
            storefrontId: selectedStorefrontForItems.id,
            itemId: selectedItem.id,
          });
        }}
        isPending={deleteItemMutation.isPending}
      />
    </>
  );
}
