import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 16, 24, 32],
  itemLabel = 'employees',
  className = '',
}) => {
  const [jumpInput, setJumpInput] = useState('');

  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Smart page calculation
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftBound = Math.max(2, currentPage - 1);
    const rightBound = Math.min(totalPages - 1, currentPage + 1);

    pages.push(1);

    if (leftBound > 2) {
      pages.push('...');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpInput('');
    }
  };

  return (
    <div
      className={`bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 select-none ${className}`}
    >
      {/* Left: Summary & Page Size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
        <div>
          Showing <span className="font-bold text-[#12141F]">{startItem}–{endItem}</span> of{' '}
          <span className="font-bold text-[#12141F]">{totalItems}</span> {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-400">Per page:</span>
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-200/80">
              {pageSizeOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onPageSizeChange(opt)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    pageSize === opt
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#12141F] hover:bg-slate-200/50'
                  }`}
                  title={`${opt} items per page`}
                >
                  {opt === 8 ? '8 (2×4)' : opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center & Right: Numbered Pagination Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Jump to first page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors border border-transparent hover:border-slate-200"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page arrow */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 h-8 rounded-full flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all border border-slate-200/80 hover:border-primary/30"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 text-center text-slate-400 font-bold text-xs"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[32px] h-8 px-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-glow ring-2 ring-primary/20 scale-105'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next page arrow */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 h-8 rounded-full flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all border border-slate-200/80 hover:border-primary/30"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Jump to last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors border border-transparent hover:border-slate-200"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Quick jump to page */}
        {totalPages > 5 && (
          <form onSubmit={handleJump} className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={String(currentPage)}
              className="w-12 h-7 px-1 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary text-[#12141F]"
            />
            <button
              type="submit"
              className="px-2 h-7 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-primary hover:text-white text-slate-600 transition-all"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
