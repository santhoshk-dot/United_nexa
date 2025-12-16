import React from 'react';
import { Calendar, CalendarDays, CalendarRange, Clock, ListFilter } from 'lucide-react';
import { Input } from './Input';
import { getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../utils/dateHelpers';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  icon?: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, icon, children, ...props }) => {
  return (
    <button
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        text-sm font-medium rounded-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1
        active:scale-[0.98]
        ${active 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-border'
        }
      `}
      {...props}
    >
      {icon && <span className={`${active ? 'opacity-100' : 'opacity-60'}`}>{icon}</span>}
      {children}
    </button>
  );
};

interface DateFilterButtonsProps {
  filterType: string;
  setFilterType: (type: string) => void;
  customStart: string;
  setCustomStart: (date: string) => void;
  customEnd: string;
  setCustomEnd: (date: string) => void;
  hideInputs?: boolean; // 🟢 Added this prop
}

export const DateFilterButtons = ({
  filterType,
  setFilterType,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  hideInputs = false // 🟢 Default to false
}: DateFilterButtonsProps) => {

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <FilterButton 
          active={filterType === 'all'} 
          onClick={() => setFilterType('all')}
          icon={<ListFilter className="w-4 h-4" />}
        >
          All
        </FilterButton>
        <FilterButton 
          active={filterType === 'today'} 
          onClick={() => setFilterType('today')}
          icon={<Calendar className="w-4 h-4" />}
        >
          Today
        </FilterButton>
        <FilterButton 
          active={filterType === 'yesterday'} 
          onClick={() => setFilterType('yesterday')}
          icon={<Clock className="w-4 h-4" />}
        >
          Yesterday
        </FilterButton>
        <FilterButton 
          active={filterType === 'week'} 
          onClick={() => setFilterType('week')}
          icon={<CalendarDays className="w-4 h-4" />}
        >
          Last 7 Days
        </FilterButton>
        <FilterButton 
          active={filterType === 'custom'} 
          onClick={() => setFilterType('custom')}
          icon={<CalendarRange className="w-4 h-4" />}
        >
          Custom Range
        </FilterButton>
      </div>
      
      {/* Custom Date Range Panel - 🟢 Conditionally rendered based on hideInputs */}
      {filterType === 'custom' && !hideInputs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-xl animate-in slide-in-from-top-2 duration-200">
          <Input 
            label="Start Date" 
            id="customStart" 
            name="customStart" 
            type="date" 
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <Input 
            label="End Date" 
            id="customEnd" 
            name="customEnd" 
            type="date" 
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Re-exporting date helpers for any components that still import from here
export { getTodayDate, getYesterdayDate, isDateInLast7Days };