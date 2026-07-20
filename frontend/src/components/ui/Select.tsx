import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  group?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  hint?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, required, options, value, onChange, disabled, name, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

    // Handle outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset focused index when opened
    useEffect(() => {
      if (isOpen) {
        const index = options.findIndex(opt => String(opt.value) === String(value));
        setFocusedIndex(index >= 0 ? index : 0);
      }
    }, [isOpen, value, options]);

    // Scroll into view when keyboard navigating
    useEffect(() => {
      if (isOpen && listboxRef.current && focusedIndex >= 0) {
        // Find the actual li element, bypassing group headers
        const optionElements = Array.from(listboxRef.current.querySelectorAll('[role="option"]'));
        const activeElement = optionElements[focusedIndex] as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [focusedIndex, isOpen]);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen) {
            if (focusedIndex >= 0 && focusedIndex < options.length) {
              onChange(options[focusedIndex].value);
              setIsOpen(false);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    const handleOptionClick = (val: string | number) => {
      onChange(val);
      setIsOpen(false);
    };

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[12px] font-medium text-primary uppercase tracking-wider flex justify-between items-center">
            <span>
              {label} {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            {hint && <span className="text-muted lowercase">{hint}</span>}
          </label>
        )}
        <div 
          className="relative" 
          ref={containerRef}
          onKeyDown={handleKeyDown}
        >
          {/* Hidden native select for form compatibility if needed */}
          <select 
            ref={ref} 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            disabled={disabled} 
            required={required} 
            name={name}
            className="absolute opacity-0 inset-0 w-full h-full -z-10"
            tabIndex={-1}
            aria-hidden="true"
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Custom Select Trigger */}
          <div
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="custom-select-listbox"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-background border border-border text-[13px] cursor-pointer transition-colors focus:outline-none focus:border-primary",
              disabled && "opacity-50 cursor-not-allowed bg-gray-50",
              isOpen && "border-primary ring-1 ring-primary/20",
              className
            )}
          >
            <span className="truncate">{selectedOption?.label || "Select..."}</span>
            <ChevronDown className={cn("w-4 h-4 text-muted transition-transform", isOpen && "rotate-180")} />
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-sm shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <ul 
                id="custom-select-listbox"
                role="listbox"
                ref={listboxRef}
                className="max-h-60 overflow-auto py-1"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isFocused = index === focusedIndex;
                  const showGroup = option.group && (index === 0 || options[index - 1].group !== option.group);

                  return (
                    <React.Fragment key={option.value}>
                      {showGroup && (
                        <li className="px-4 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider bg-gray-50/50 mt-1 first:mt-0">
                          {option.group}
                        </li>
                      )}
                      <li
                        role="option"
                        aria-selected={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptionClick(option.value);
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={cn(
                          "relative flex items-center px-4 py-2 text-[13px] cursor-pointer transition-colors",
                          option.group ? "pl-6" : "",
                          isSelected ? "bg-primary/5 text-primary font-medium" : "text-foreground",
                          isFocused && !isSelected && "bg-gray-100",
                        )}
                      >
                        <span className="truncate pr-6">{option.label}</span>
                        {isSelected && (
                          <span className="absolute right-4 flex items-center text-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
