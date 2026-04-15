'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

function range(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
}

export function Pagination({
  currentPage,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const DOTS = 'dots';

  const paginationRange = React.useMemo(() => {
    // https://www.freecodecamp.org/news/pagination-utility-function-for-react-components/
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= pageCount) {
      return range(1, pageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, pageCount);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < pageCount - 1;

    const firstPageIndex = 1;
    const lastPageIndex = pageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [...range(1, leftItemCount), DOTS, lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [firstPageIndex, DOTS, ...range(pageCount - rightItemCount + 1, pageCount)];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      return [
        firstPageIndex,
        DOTS,
        ...range(leftSiblingIndex, rightSiblingIndex),
        DOTS,
        lastPageIndex,
      ];
    }

    return range(1, pageCount);
  }, [currentPage, pageCount, siblingCount]);

  if (pageCount <= 1) {
    return null;
  }

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, pageCount));
    onPageChange(pageNumber);
  };

  return (
    <nav
      aria-label="分页导航"
      className={cn('flex items-center gap-1', className)}
    >
      {/* 首页 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        aria-label="首页"
        className="h-8 w-8 p-0"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* 上一页 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="上一页"
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 页码 */}
      {paginationRange.map((pageNumber, index) => {
        if (pageNumber === DOTS) {
          return (
            <span
              key={`dots-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          );
        }

        const isActive = pageNumber === currentPage;

        return (
          <Button
            key={pageNumber}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => goToPage(pageNumber)}
            aria-label={`第 ${pageNumber} 页`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'h-8 min-w-[32px] px-2',
              isActive && 'pointer-events-none'
            )}
          >
            {pageNumber}
          </Button>
        );
      })}

      {/* 下一页 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === pageCount}
        aria-label="下一页"
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 末页 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goToPage(pageCount)}
        disabled={currentPage === pageCount}
        aria-label="末页"
        className="h-8 w-8 p-0"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
