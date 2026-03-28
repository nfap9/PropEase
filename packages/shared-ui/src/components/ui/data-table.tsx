'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Skeleton } from './skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

type RowClassName<TData> = string | ((row: Row<TData>) => string | undefined);

export interface DataTableProps<TData, TValue> {
  /** 列定义，直接复用 TanStack Table 的类型。 */
  columns: ColumnDef<TData, TValue>[];
  /** 表格数据源。 */
  data: TData[];
  /** 表格标题。 */
  title?: string;
  /** 表格描述。 */
  description?: string;
  /** 顶部工具区，例如筛选器、操作按钮。 */
  toolbar?: React.ReactNode;
  /** 是否显示分页，默认 `true`。 */
  enablePagination?: boolean;
  /** 默认每页条数。 */
  defaultPageSize?: number;
  /** 页大小切换选项。 */
  pageSizeOptions?: number[];
  /** 加载状态。 */
  isLoading?: boolean;
  /** 加载态骨架行数。 */
  loadingRowCount?: number;
  /** 空状态标题。 */
  emptyTitle?: string;
  /** 空状态补充文案。 */
  emptyDescription?: string;
  /** 外层容器类名。 */
  className?: string;
  /** 行类名。 */
  rowClassName?: RowClassName<TData>;
  /** 点击行的回调。 */
  onRowClick?: (row: Row<TData>) => void;
  /** 透传给 TanStack 的 `getRowId`。 */
  getRowId?: Parameters<typeof useReactTable<TData>>[0]['getRowId'];
  /** 测试选择器。 */
  testid?: string;
}

function resolveRowClassName<TData>(
  rowClassName: RowClassName<TData> | undefined,
  row: Row<TData>
): string | undefined {
  if (!rowClassName) {
    return undefined;
  }

  return typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
}

/**
 * 通用数据表格组件。
 * 封装了项目中最常用的列表能力：排序、过滤、客户端分页、加载态和统一空态。
 *
 * 设计原则：
 * 1. 数据和列定义由业务层提供，组件只负责列表呈现与交互壳层；
 * 2. 保持 TanStack Table 的扩展性，方便后续接入更多高级能力；
 * 3. 提供统一分页栏和页大小切换，避免页面反复拷贝实现。
 */
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
  onRowClick,
  getRowId,
  testid,
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
  const currentPage = enablePagination ? Math.min(table.getState().pagination.pageIndex + 1, pageCount) : 1;
  const visibleRows = enablePagination ? table.getRowModel().rows : table.getPrePaginationRowModel().rows;
  const shouldShowEmpty = !isLoading && visibleRows.length === 0;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid={testid}>
      {title || description || toolbar ? (
        <CardHeader className="border-border/60 from-primary/[0.03] gap-4 border-b bg-gradient-to-r to-transparent pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <CardTitle className="text-base sm:text-lg">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </CardHeader>
      ) : null}

      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="border-border/70 bg-background/80 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({
                  length: enablePagination ? pagination.pageSize : loadingRowCount,
                }).map((_, index) => (
                  <TableRow key={`loading-row-${index}`}>
                    {columns.map((column, columnIndex) => (
                      <TableCell key={`${String(column.id ?? columnIndex)}-${columnIndex}`}>
                        <Skeleton className="h-4 w-full max-w-[12rem]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : shouldShowEmpty ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-36">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <p className="text-foreground text-sm font-semibold">{emptyTitle}</p>
                      <p className="text-muted-foreground max-w-md text-sm">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(onRowClick ? 'cursor-pointer' : undefined, resolveRowClassName(rowClassName, row))}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-border/70 bg-muted/[0.18] flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span>
              共 <span className="text-foreground font-semibold">{table.getFilteredRowModel().rows.length}</span> 条记录
            </span>
            {enablePagination && pageSizeOptions.length > 0 ? (
              <div className="flex items-center gap-2">
                <span>每页</span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="bg-background h-8 w-[92px]">
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
            ) : null}
          </div>

          {enablePagination ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                第 <span className="text-foreground font-semibold">{currentPage}</span> /{' '}
                <span className="text-foreground font-semibold">{pageCount}</span> 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
