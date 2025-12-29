/* eslint-disable @typescript-eslint/no-explicit-any */
import Select, {
    components,
    type DropdownIndicatorProps,
    type StylesConfig,
    type GroupBase
} from 'react-select';
import { ChevronDown, X, Check } from 'lucide-react';

export interface OptionType {
    value: string;
    label: string;
    [key: string]: any;
}

interface AppSelectProps {
    label?: string;
    placeholder?: string;
    options: OptionType[];
    value: string | string[];
    onChange: (value: any) => void;
    isDisabled?: boolean;
    required?: boolean;
    isMulti?: boolean;
    hideRequiredIndicator?: boolean;
    className?: string;
    maxMenuHeight?: number;
}

// --- CUSTOM COMPONENTS (Matching AsyncAutocomplete) ---

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

const CustomOption = (props: any) => {
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

export const AppSelect = ({
    label,
    placeholder = "Select...",
    options,
    value,
    onChange,
    isDisabled,
    required,
    isMulti = false,
    hideRequiredIndicator,
    className,
    maxMenuHeight = 220,
}: AppSelectProps) => {

    const showAsterisk = required && !hideRequiredIndicator;

    // Convert string value to OptionType for react-select
    const getValue = () => {
        if (isMulti && Array.isArray(value)) {
            return options.filter(opt => value.includes(opt.value));
        }
        return options.find(opt => opt.value === value) || null;
    };

    const handleChange = (newValue: any) => {
        if (isMulti) {
            onChange(newValue ? newValue.map((opt: any) => opt.value) : []);
        } else {
            onChange(newValue ? newValue.value : '');
        }
    };

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
        singleValue: (provided) => ({
            ...provided,
            color: 'hsl(var(--foreground))',
            fontSize: '0.875rem',
            fontWeight: 500,
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'hsl(var(--muted-foreground) / 0.7)',
            fontSize: '0.875rem',
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
        indicatorSeparator: () => ({ display: 'none' }),
        indicatorsContainer: (provided) => ({
            ...provided,
            gap: '4px',
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
            <Select
                options={options}
                value={getValue()}
                onChange={handleChange}
                isDisabled={isDisabled}
                isClearable={!isDisabled && !required}
                isMulti={isMulti}
                placeholder={placeholder}
                styles={customStyles}
                components={{
                    DropdownIndicator,
                    ClearIndicator,
                    Option: CustomOption,
                }}
                classNamePrefix="react-select"
                maxMenuHeight={maxMenuHeight}
            />
        </div>
    );
};
