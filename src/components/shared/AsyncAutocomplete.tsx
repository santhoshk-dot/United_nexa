/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import {
  components,
  type DropdownIndicatorProps,
  type StylesConfig,
  type MultiValue,
  type SingleValue,
  type GroupBase,
  type ValueContainerProps
} from 'react-select';
import { ChevronDown, X, Loader2 } from 'lucide-react';
import React from 'react';

// Define the shape of an Option
export interface OptionType {
  value: string;
  label: string;
  [key: string]: any;
}

interface AsyncAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: OptionType | null | MultiValue<OptionType>;
  onChange: (value: SingleValue<OptionType> | MultiValue<OptionType>) => void;
  loadOptions: (search: string, loadedOptions: any, { page }: any) => Promise<any>;
  isDisabled?: boolean;
  required?: boolean;
  isMulti?: boolean;
  defaultOptions?: boolean;
  hideRequiredIndicator?: boolean;
  className?: string;
  menuPortalTarget?: HTMLElement | null; // 🟢 NEW: For rendering dropdown outside overflow containers
}

// --- CUSTOM COMPONENTS ---

const DropdownIndicator = (props: DropdownIndicatorProps<OptionType, boolean>) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown size={16} className="text-muted-foreground opacity-50" />
    </components.DropdownIndicator>
  );
};

const ClearIndicator = (props: any) => {
  return (
    <components.ClearIndicator {...props}>
      <X size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
    </components.ClearIndicator>
  );
};

const LoadingIndicator = () => {
  return (
    <div className="p-2 mr-1">
      <Loader2 size={16} className="animate-spin text-primary" />
    </div>
  );
};

// Custom Value Container to handle "+ N more" logic
const CustomValueContainer = ({ children, ...props }: ValueContainerProps<OptionType, boolean>) => {
  const { isMulti, getValue } = props;
  const selected = getValue();
  const MAX_VISIBLE_TAGS = 2; // How many tags to show before truncating

  // If not multi-select or selection is small, render normally
  if (!isMulti || selected.length <= MAX_VISIBLE_TAGS) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    );
  }

  // Extract the Input component (it's always the last child in react-select)
  const childrenArray = React.Children.toArray(children);
  const inputComponent = childrenArray[childrenArray.length - 1];

  // Get the visible chips
  const visibleChips = childrenArray.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = selected.length - MAX_VISIBLE_TAGS;

  return (
    <components.ValueContainer {...props}>
      {visibleChips}
      <div className="flex items-center justify-center px-2 py-0.5 ml-1 text-[10px] font-medium bg-muted text-muted-foreground rounded-md whitespace-nowrap h-[24px]">
        +{hiddenCount} more
      </div>
      {inputComponent}
    </components.ValueContainer>
  );
};

// --- MAIN COMPONENT ---

export const AsyncAutocomplete = ({
  label,
  placeholder = "Select...",
  value,
  onChange,
  loadOptions,
  isDisabled,
  required,
  defaultOptions = true,
  hideRequiredIndicator,
  className,
  isMulti = false,
  menuPortalTarget, // 🟢 NEW
}: AsyncAutocompleteProps) => {

  const showAsterisk = required && !hideRequiredIndicator;
  const [shouldLoad, setShouldLoad] = useState(defaultOptions);

  // 🟢 NEW: Cache to store the default list (page 1) loaded when search is empty
  const defaultOptionsCache = useRef<OptionType[]>([]);

  const handleMenuOpen = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  const loadOptionsWrapper = async (search: string, prevOptions: any, { page }: any) => {
    // 🟢 1. OPTIMIZATION: Local filtering from Cache
    // If we have cached default options and user is typing, try to find match locally first.
    if (search && defaultOptionsCache.current.length > 0) {
      const normalizedSearch = search.toLowerCase();
      const localMatches = defaultOptionsCache.current.filter((opt: OptionType) =>
        opt.label.toLowerCase().includes(normalizedSearch)
      );

      // If we found matches in our cache, return them immediately.
      // This prevents the API call.
      if (localMatches.length > 0) {
        return {
          options: localMatches,
          hasMore: false, // Assume no more from server if we found local matches (optional strictness)
        };
      }
    }

    // 🟢 2. NORMAL FETCH: If no local match or search is empty, call API
    const response = await loadOptions(search, prevOptions, { page });

    // 🟢 3. CACHE UPDATE: If this was a default load (no search, page 1), save to cache
    if (!search && page === 1 && response.options) {
      defaultOptionsCache.current = response.options;
    }

    return response;
  };

  // 耳 STYLES
  const customStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      borderColor: state.isFocused
        ? 'hsl(var(--primary))'
        : 'hsl(var(--muted-foreground) / 0.3)',
      color: 'hsl(var(--foreground))',
      borderRadius: '0.375rem',
      padding: '0 2px',
      minHeight: '38px',
      maxHeight: isMulti ? '80px' : undefined,
      overflowY: isMulti ? 'auto' : undefined,
      boxShadow: state.isFocused
        ? '0 0 0 1px hsl(var(--primary))'
        : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        borderColor: state.isFocused
          ? 'hsl(var(--primary))'
          : 'hsl(var(--muted-foreground) / 0.5)',
      },
      transition: 'all 0.2s',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',
      gap: '4px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      marginTop: '4px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? 'hsl(var(--muted))'
        : state.isSelected
          ? 'hsl(var(--primary) / 0.1)'
          : 'transparent',
      color: state.isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
      cursor: 'pointer',
      fontSize: '0.875rem',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: 'hsl(var(--primary) / 0.2)',
      }
    }),
    input: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '0.875rem',
      margin: 0,
      padding: 0,
      "input:focus": {
        boxShadow: "none !important",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '0.875rem',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--muted))',
      borderRadius: '4px',
      margin: '0',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '0.80rem',
      padding: '2px 6px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      ':hover': {
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        color: 'hsl(var(--destructive))',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      fontSize: '0.875rem',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    // 🟢 NEW: Style for portal menu
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label} {showAsterisk && <span className="text-destructive">*</span>}
        </label>
      )}
      <AsyncPaginate
        value={value}
        loadOptions={loadOptionsWrapper}
        onChange={onChange}
        onMenuOpen={handleMenuOpen}
        isDisabled={isDisabled}
        isClearable={!isDisabled}
        isMulti={isMulti}
        placeholder={placeholder}
        defaultOptions={shouldLoad}
        additional={{ page: 1 }}
        styles={customStyles}
        components={{
          DropdownIndicator,
          ClearIndicator,
          LoadingIndicator,
          ValueContainer: CustomValueContainer
        }}
        debounceTimeout={400}
        classNamePrefix="react-select"
        menuPortalTarget={menuPortalTarget} // 🟢 NEW
        menuPosition={menuPortalTarget ? 'fixed' : undefined} // 🟢 NEW
      />
    </div>
  );
};
