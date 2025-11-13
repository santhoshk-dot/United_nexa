import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button'; // Assuming Button.tsx is already updated

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalItems: number;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: PaginationProps) => {

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Left Side: Item Count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalItems > 0 ? startIndex : 0} to {endIndex} of {totalItems} results
      </div>

      {/* Right Side: Controls */}
      <div className="flex items-center justify-end gap-4 sm:gap-6 flex-wrap">
        
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-muted-foreground/30 rounded-md bg-background focus:outline-none focus:ring-primary focus:border-primary"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="w-auto px-2"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="w-auto px-2"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};