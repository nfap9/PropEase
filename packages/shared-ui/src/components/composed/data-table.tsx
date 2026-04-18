
import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from '../shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Skeleton } from '../shadcn/skeleton';
import { Card } from '../shadcn/card';
import { Pagination } from './pagination';

type RowClassName<TData> = string | ((row: TData) => string | undefined);

export type ColumnMeta = {
  sticky?: 'left' | 'right';
};

function getStickyClass(meta: ColumnMeta | undefined, isHeader = false): string | undefined {
  if (!meta?.sticky) return undefined;
  const bg = isHeader ? 'bg-muted' : 'bg-card';
  if (meta.sticky === 'left') {
    return `sticky left-0 z-10 ${bg}`;
  }
  if (meta.sticky === 'right') {
    return `sticky right-0 z-10 ${bg}`;
  }
  return undefined;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  enablePagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  loadingRowCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  rowClassName?: RowClassName<TData>;
  getRowId?: (row: TData) => string;
  testid?: string;
  useCard?: boolean;
}

function resolveRowClassName<TData>(
  rowClassName: RowClassName<TData> | undefined,
  row: TData
): string | undefined {
  if (!rowClassName) return undefined;
  return typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  toolbar,
  enablePagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false,
  loadingRowCount = 5,
  emptyTitle = '暂无数据',
  emptyDescription = '当前没有可展示的记录。',
  className,
  rowClassName,
  getRowId,
  testid,
  useCard = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const pageCount = enablePagination ? Math.max(table.getPageCount(), 1) : 1;
  const currentPage = enablePagination
    ? Math.min(table.getState().pagination.pageIndex + 1, pageCount)
    : 1;
  const visibleRows = enablePagination
    ? table.getRowModel().rows
    : table.getPrePaginationRowModel().rows;
  const shouldShowEmpty = !isLoading && visibleRows.length === 0;

  const renderHeader = () => {
    if (!title && !description) return null;

    if (useCard) {
      return (
        <div className="border-b p-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      );
    }

    return (
      <div className="px-1 pb-2">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    );
  };

  const renderToolbar = () => {
    if (!toolbar) return null;

    if (useCard) {
      return <div className="flex items-center justify-between p-4">{toolbar}</div>;
    }

    return <div className="px-1">{toolbar}</div>;
  };

  const renderTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full caption-bottom text-sm">
        <thead className="border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize(), minWidth: header.column.columnDef.minSize }}
                  className={cn(
                    'h-11 bg-muted px-4 text-left align-middle text-sm font-medium text-foreground [&:has([role=checkbox])]:pr-0',
                    getStickyClass(header.column.columnDef.meta as ColumnMeta | undefined, true)
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({
              length: enablePagination ? pagination.pageSize : loadingRowCount,
            }).map((_, index) => (
              <tr key={`loading-row-${index}`} className="border-b">
                {columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="h-16 px-4">
                    <Skeleton className="h-4 w-full max-w-[12rem]" />
                  </td>
                ))}
              </tr>
            ))
          ) : shouldShowEmpty ? (
            <tr>
              <td colSpan={columns.length} className="h-36 text-center align-middle">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
                  <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                </div>
              </td>
            </tr>
          ) : (
            visibleRows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn(
                  'border-b transition-colors hover:bg-accent',
                  resolveRowClassName(rowClassName, row.original)
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize(), minWidth: cell.column.columnDef.minSize }}
                    className={cn(
                      'h-12 bg-card px-4 text-left align-middle [&:has([role=checkbox])]:pr-0',
                      getStickyClass(cell.column.columnDef.meta as ColumnMeta | undefined)
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          共 <span className="font-semibold text-foreground">{table.getFilteredRowModel().rows.length}</span> 条记录
        </span>
        {enablePagination && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span>每页</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[92px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {enablePagination && (
        <Pagination
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      )}
    </div>
  );

  if (useCard) {
    return (
      <div className={cn('space-y-4', className)} data-testid={testid}>
        <Card className="w-full p-4 sm:p-6">
          {renderHeader()}
          {renderToolbar()}
          {renderTable()}
          {renderPagination()}
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid={testid}>
      {renderHeader()}
      {renderToolbar()}
      {renderTable()}
      {renderPagination()}
    </div>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.ThHTMLAttributes<HTMLTableCellElement> {
  column: { getIsSorted: () => 'asc' | 'desc' | false; toggleSorting: (desc?: boolean) => void };
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 px-2 text-sm font-medium', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
