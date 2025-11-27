import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from './Button';

// Simple Command-like list implementation
const CommandList = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-60 overflow-y-auto">{children}</div>
);

const CommandItem = ({ onSelect, children, isSelected }: { onSelect: () => void, children: React.ReactNode, isSelected: boolean }) => (
  <div
    onClick={(e) => {
      e.stopPropagation(); // Prevent event bubbling
      onSelect();
    }}
    className={`flex items-center justify-between p-2 text-sm cursor-pointer hover:bg-muted ${isSelected ? 'font-medium' : ''}`}
  >
    <div className="flex items-center">
      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
        {isSelected && <Check size={12} />}
      </div>
      {children}
    </div>
  </div>
);

const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="p-2 text-sm text-center text-muted-foreground">{children}</div>
);

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <div className="p-2 border-b border-muted">
      <input
        {...props}
        ref={ref}
        // Standardized input classes with background color fix
        className="w-full px-3 py-2 text-sm bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
        onClick={(e) => e.stopPropagation()} // Ensure typing doesn't trigger close logic
      />
    </div>
  )
);

// --- Main MultiSelect Component ---
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyPlaceholder: string;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyPlaceholder,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Refs for handling outside clicks and input focus
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  const selectedLabels = options
    .filter(option => selected.includes(option.value))
    .map(option => option.label);

  return (
    <div 
      className="relative w-full" 
      ref={containerRef}
      // REMOVED: onMouseLeave prop that was causing the dropdown to close unexpectedly
    >
      {/* Trigger Button */}
      <div onClick={() => setOpen(!open)}>
        <Button
          type="button"
          variant="secondary"
          className="w-full h-auto min-h-[42px] justify-between font-normal bg-background border border-muted-foreground/30 text-muted-foreground hover:bg-muted"
        >
          <div className="flex flex-wrap gap-1 flex-1 items-center">
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedLabels.map(label => (
                <span key={label} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-foreground">
                  {label}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent dropdown toggle when removing tag
                      const valueToUnselect = options.find(o => o.label === label)?.value;
                      if (valueToUnselect) handleToggle(valueToUnselect);
                    }} 
                  />
                </span>
              ))
            )}
          </div>
          <ChevronsUpDown size={16} className="ml-2 opacity-50 flex-shrink-0" />
        </Button>
      </div>

      {/* Dropdown Content */}
      {open && (
        <div className="absolute z-10 top-full mt-1 w-full bg-background border border-muted-foreground/30 rounded-md shadow-lg">
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            ) : (
              filteredOptions.map(option => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                  isSelected={selected.includes(option.value)}
                >
                  {option.label}
                </CommandItem>
              ))
            )}
          </CommandList>
        </div>
      )}
    </div>
  );
};