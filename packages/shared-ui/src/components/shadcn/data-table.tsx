'use client';

import * as React from 'react';
import type {
  ColumnDef,
  SortingState,
  PaginationState,
  ColumnFiltersState,
  RowSelectionState,
  Row,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Skeleton } from './skeleton';
import { Checkbox } from './checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableGlobalSearch } from './data-table-global-search';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  enableSorting?: boolean;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  getRowId?: (row: TData) => string;
  testid?: string;
  toolbar?: React.ReactNode;

  // === 分页 ===
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  enablePagination?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  total?: number;

  // === 全局搜索 ===
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  enableGlobalSearch?: boolean;
  onGlobalSearchSubmit?: (filter: string) => void;
  searchPlaceholder?: string;

  // === 列筛选 ===
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;

  // === 行选择 ===
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  selectionMode?: 'single' | 'multiple';

  // === 卡片模式 ===
  useCard?: boolean;
  cardTitle?: string;
  cardDescription?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  sorting,
  onSortingChange,
  enableSorting = true,
  loading = false,
  loadingRows = 5,
  emptyTitle = '暂无数据',
  getRowId,
  testid,
  toolbar,
  // 分页
  pagination,
  onPaginationChange,
  enablePagination = false,
  manualPagination = false,
  pageCount: pageCountProp,
  total,
  // 全局搜索
  globalFilter,
  onGlobalFilterChange,
  enableGlobalSearch = false,
  onGlobalSearchSubmit,
  searchPlaceholder = '搜索...',
  // 列筛选
  columnFilters,
  onColumnFiltersChange,
  // 行选择
  rowSelection,
  onRowSelectionChange,
  enableRowSelection = false,
  selectionMode = 'multiple',
  // 卡片模式
  useCard = false,
  cardTitle,
  cardDescription,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(sorting ?? []);
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>(
    pagination ?? { pageIndex: 0, pageSize: 20 }
  );
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState<string>(globalFilter ?? '');
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>(columnFilters ?? []);
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>(rowSelection ?? {});

  const handleSortingChange = React.useCallback(
    (updater: React.SetStateAction<SortingState>) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    [internalSorting, onSortingChange]
  );

  const handlePaginationChange = React.useCallback(
    (updater: React.SetStateAction<PaginationState>) => {
      const newPagination = typeof updater === 'function' ? updater(internalPagination) : updater;
      setInternalPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    [internalPagination, onPaginationChange]
  );

  const handleGlobalFilterChange = React.useCallback(
    (filter: string) => {
      setInternalGlobalFilter(filter);
      onGlobalFilterChange?.(filter);
    },
    [onGlobalFilterChange]
  );

  const handleGlobalSearchSubmit = React.useCallback(
    (filter: string) => {
      onGlobalSearchSubmit?.(filter);
    },
    [onGlobalSearchSubmit]
  );

  const handleColumnFiltersChange = React.useCallback(
    (updater: React.SetStateAction<ColumnFiltersState>) => {
      const newFilters = typeof updater === 'function' ? updater(internalColumnFilters) : updater;
      setInternalColumnFilters(newFilters);
      onColumnFiltersChange?.(newFilters);
    },
    [internalColumnFilters, onColumnFiltersChange]
  );

  const handleRowSelectionChange = React.useCallback(
    (updater: React.SetStateAction<RowSelectionState>) => {
      const newSelection = typeof updater === 'function' ? updater(internalRowSelection) : updater;
      setInternalRowSelection(newSelection);
      onRowSelectionChange?.(newSelection);
    },
    [internalRowSelection, onRowSelectionChange]
  );

  // 添加选择列
  const columnsWithSelection = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      size: 40,
      header: ({ table }) => {
        if (selectionMode === 'single') return null;
        return (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="全选"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label="选择"
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection, selectionMode]);

  // 计算 pageCount
  const computedPageCount = React.useMemo(() => {
    if (manualPagination) {
      return pageCountProp ?? -1;
    }
    const filteredData = enableGlobalSearch || (columnFilters?.length ?? 0) > 0
      ? data.length
      : data.length;
    return Math.ceil(filteredData / internalPagination.pageSize);
  }, [manualPagination, pageCountProp, data.length, internalPagination.pageSize, enableGlobalSearch, columnFilters?.length]);

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: {
      sorting: sorting ?? internalSorting,
      pagination: enablePagination ? (pagination ?? internalPagination) : undefined,
      globalFilter: enableGlobalSearch ? (globalFilter ?? internalGlobalFilter) : undefined,
      columnFilters: columnFilters ?? internalColumnFilters,
      rowSelection: rowSelection ?? internalRowSelection,
    },
    onSortingChange: enableSorting ? handleSortingChange : undefined,
    onPaginationChange: enablePagination ? handlePaginationChange : undefined,
    onGlobalFilterChange: enableGlobalSearch ? handleGlobalFilterChange : undefined,
    onColumnFiltersChange: onColumnFiltersChange ? handleColumnFiltersChange : undefined,
    onRowSelectionChange: onRowSelectionChange ? handleRowSelectionChange : undefined,
    enableSorting,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: (enableGlobalSearch || (columnFilters?.length ?? 0) > 0) ? getFilteredRowModel() : undefined,
    getRowId: getRowId as (row: TData) => string,
    // 分页配置
    manualPagination,
    pageCount: computedPageCount,
  });

  // 获取分页后的行数据
  const displayData = React.useMemo(() => {
    if (!enablePagination) return data;
    if (manualPagination) return data;
    return table.getRowModel().rows.map(row => row.original);
  }, [enablePagination, manualPagination, data, table]);

  const tableContent = (
    <div className="w-full">
      {(toolbar || enableGlobalSearch) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          {enableGlobalSearch && (
            <DataTableGlobalSearch
              value={globalFilter ?? internalGlobalFilter}
              onChange={handleGlobalFilterChange}
              onSubmit={onGlobalSearchSubmit ? handleGlobalSearchSubmit : undefined}
              placeholder={searchPlaceholder}
            />
          )}
          {toolbar && <div className="flex-1">{toolbar}</div>}
        </div>
      )}
      <div className="rounded-md border">
        <Table data-testid={testid}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyTitle}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && !loading && table.getRowModel().rows.length > 0 && (
        <DataTablePagination
          pageIndex={table.getState().pagination.pageIndex}
          pageCount={table.getPageCount()}
          pageSize={table.getState().pagination.pageSize}
          total={total ?? (manualPagination ? undefined : data.length)}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onPageChange={(page) => table.setPageIndex(page)}
          onPageSizeChange={table.setPageSize}
        />
      )}
    </div>
  );

  if (!useCard) {
    return tableContent;
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {(cardTitle || cardDescription) && (
        <div className="p-6 pb-4">
          {cardTitle && <h3 className="text-lg font-semibold leading-none tracking-tight">{cardTitle}</h3>}
          {cardDescription && <p className="mt-1 text-sm text-muted-foreground">{cardDescription}</p>}
        </div>
      )}
      <div className="px-6 pb-6">{tableContent}</div>
    </div>
  );
}
