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
  type ValueContainerProps,
  type OptionProps
} from 'react-select';
import { ChevronDown, X, Loader2, Check } from 'lucide-react';
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
  menuPortalTarget?: HTMLElement | null;
  maxMenuHeight?: number;
  closeMenuOnSelect?: boolean;
  showAllSelected?: boolean;
}

// --- CUSTOM COMPONENTS ---

const DropdownIndicator = (props: DropdownIndicatorProps<OptionType, boolean>) => {
  return (
    <components.DropdownIndicator {...props}>
      <div className={`transition-transform duration-200 ${props.selectProps.menuIsOpen ? 'rotate-180' : ''}`}>
        <ChevronDown size={18} className="text-muted-foreground/60" />
      </div>
    </components.DropdownIndicator>
  );
};

const ClearIndicator = (props: any) => {
  return (
    <components.ClearIndicator {...props}>
      <div className="p-1 rounded-md hover:bg-destructive/10 transition-colors duration-200">
        <X size={14} className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors" />
      </div>
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

// Custom Option with checkmark for selected items
const CustomOption = (props: OptionProps<OptionType, boolean>) => {
  const { isSelected, data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
          {data.label}
        </span>
        {isSelected && (
          <Check size={16} className="text-primary flex-shrink-0 ml-2" />
        )}
      </div>
    </components.Option>
  );
};

// Custom Value Container factory to handle "+ N more" logic
// Using a factory function to pass showAllSelected without module augmentation
const createCustomValueContainer = (showAllSelected: boolean) => {
  const CustomValueContainer = ({ children, ...props }: ValueContainerProps<OptionType, boolean>) => {
    const { isMulti, getValue } = props;
    const selected = getValue();
    const MAX_VISIBLE_TAGS = 2;

    if (!isMulti || showAllSelected || selected.length <= MAX_VISIBLE_TAGS) {
      return (
        <components.ValueContainer {...props}>
          {children}
        </components.ValueContainer>
      );
    }

    const childrenArray = React.Children.toArray(children);
    const inputComponent = childrenArray[childrenArray.length - 1];
    const visibleChips = childrenArray.slice(0, MAX_VISIBLE_TAGS);
    const hiddenCount = selected.length - MAX_VISIBLE_TAGS;

    return (
      <components.ValueContainer {...props}>
        {visibleChips}
        <div className="inline-flex items-center justify-center px-2 py-0.5 ml-1 text-[10px] font-semibold bg-primary/10 text-primary rounded-md whitespace-nowrap h-[22px]">
          +{hiddenCount} more
        </div>
        {inputComponent}
      </components.ValueContainer>
    );
  };

  return CustomValueContainer;
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
  menuPortalTarget,
  maxMenuHeight = 220,
  closeMenuOnSelect,
  showAllSelected = false,
}: AsyncAutocompleteProps) => {

  const showAsterisk = required && !hideRequiredIndicator;
  const [shouldLoad, setShouldLoad] = useState(defaultOptions);

  // Cache to store the default list (page 1) loaded when search is empty
  const defaultOptionsCache = useRef<OptionType[]>([]);

  // Memoize the custom value container based on showAllSelected
  const CustomValueContainer = React.useMemo(
    () => createCustomValueContainer(showAllSelected),
    [showAllSelected]
  );

  const handleMenuOpen = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  // ORIGINAL LOGIC - UNCHANGED
  const loadOptionsWrapper = async (search: string, prevOptions: any, { page }: any) => {
    // 1. OPTIMIZATION: Local filtering from Cache
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
          hasMore: false,
        };
      }
    }

    // 2. NORMAL FETCH: If no local match or search is empty, call API
    const response = await loadOptions(search, prevOptions, { page });

    // 3. CACHE UPDATE: If this was a default load (no search, page 1), save to cache
    if (!search && page === 1 && response.options) {
      defaultOptionsCache.current = response.options;
    }

    return response;
  };

  // Modern Styles - ONLY VISUAL CHANGES
  const customStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isDisabled
        ? 'hsl(var(--muted) / 0.5)'
        : 'hsl(var(--background))',
      borderColor: state.isFocused
        ? 'hsl(var(--primary))'
        : 'hsl(var(--border))',
      color: 'hsl(var(--foreground))',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      minHeight: '42px',
      maxHeight: isMulti ? '80px' : undefined,
      overflowY: isMulti ? 'auto' : undefined,
      boxShadow: state.isFocused
        ? '0 0 0 3px hsl(var(--primary) / 0.1)'
        : 'none',
      '&:hover': {
        borderColor: state.isFocused
          ? 'hsl(var(--primary))'
          : 'hsl(var(--primary) / 0.5)',
      },
      transition: 'all 0.2s ease',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
      gap: '4px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
      marginTop: '6px',
      overflow: 'hidden',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '6px',
      maxHeight: `${maxMenuHeight}px`,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? 'hsl(var(--muted))'
        : state.isSelected
          ? 'hsl(var(--primary) / 0.08)'
          : 'transparent',
      color: state.isSelected
        ? 'hsl(var(--primary))'
        : 'hsl(var(--foreground))',
      cursor: 'pointer',
      fontSize: '0.875rem',
      padding: '10px 12px',
      borderRadius: '0.5rem',
      margin: '2px 0',
      fontWeight: state.isSelected ? 500 : 400,
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: 'hsl(var(--primary) / 0.15)',
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
      fontWeight: 500,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      borderRadius: '0.375rem',
      margin: '0',
      border: '1px solid hsl(var(--primary) / 0.2)',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'hsl(var(--primary))',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '2px 6px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'hsl(var(--primary) / 0.7)',
      borderRadius: '0 0.375rem 0.375rem 0',
      ':hover': {
        backgroundColor: 'hsl(var(--destructive) / 0.15)',
        color: 'hsl(var(--destructive))',
      },
      transition: 'all 0.15s ease',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground) / 0.7)',
      fontSize: '0.875rem',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided) => ({
      ...provided,
      gap: '4px',
    }),
    loadingMessage: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      fontSize: '0.875rem',
      padding: '16px',
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      fontSize: '0.875rem',
      padding: '16px',
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {showAsterisk && <span className="text-destructive ml-1">*</span>}
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
          ValueContainer: CustomValueContainer,
          Option: CustomOption,
        }}
        debounceTimeout={400}
        classNamePrefix="react-select"
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? 'fixed' : undefined}
        maxMenuHeight={maxMenuHeight}
        closeMenuOnSelect={closeMenuOnSelect}
      />
    </div>
  );
};