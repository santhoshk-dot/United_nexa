interface RadioGroupProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const RadioGroup = ({ 
  label, 
  options, 
  value, 
  onChange, 
  required
}: RadioGroupProps) => {
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {/* Radio Options */}
      <div className="flex items-center gap-3 sm:gap-4">
        {options.map(option => {
          const isSelected = value === option.value;
          
          return (
            <label
              key={option.value}
              className="relative flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Hidden native radio input */}
              <input
                name={label || 'radio-group'}
                type="radio"
                value={option.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only peer"
                required={required}
              />

              {/* Custom radio circle */}
              <span className={`
                relative flex items-center justify-center shrink-0
                w-[18px] h-[18px] sm:w-5 sm:h-5
                rounded-full border-2
                transition-all duration-200
                ${isSelected 
                  ? 'border-primary bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]' 
                  : 'border-muted-foreground/40 bg-transparent group-hover:border-primary/60'
                }
              `}>
                {/* Inner dot */}
                <span className={`
                  w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary-foreground
                  transition-all duration-200
                  ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                `} />
              </span>

              {/* Option label */}
              <span className={`
                text-sm sm:text-base font-medium
                transition-colors duration-200
                ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
              `}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};