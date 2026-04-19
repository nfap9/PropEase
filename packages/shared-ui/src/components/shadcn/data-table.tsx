'use client';

import * as React from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from './button';
import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

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
  useCard?: boolean;
  toolbar?: React.ReactNode;
  title?: string;
  description?: string;
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
  useCard = true,
  toolbar,
  title,
  description,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(sorting ?? []);

  const handleSortingChange = React.useCallback(
    (updater: React.SetStateAction<SortingState>) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    [internalSorting, onSortingChange]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sorting ?? internalSorting,
    },
    onSortingChange: enableSorting ? handleSortingChange : undefined,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getRowId: getRowId as (row: TData) => string,
  });

  const tableContent = (
    <div className="w-full">
      {toolbar && <div className="mb-4">{toolbar}</div>}
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
    </div>
  );

  if (useCard) {
    return (
      <Card>
        {(title || description) && (
          <CardHeader className="pb-0">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className={title || description ? 'p-0 pt-2' : 'p-0'}>
          {tableContent}
        </CardContent>
      </Card>
    );
  }

  return tableContent;
}
