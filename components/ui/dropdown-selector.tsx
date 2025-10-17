import React, { useState, useEffect } from 'react';
import IconoDesplegarAbajo from '@/components/icons/Icono-Desplegar Abajo.svg';

interface DropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface DropdownSelectorProps {
  label?: string;
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string | number) => void;
  className?: string;
  dropdownClassName?: string;
  openDirection?: 'up' | 'down';
  minWidth?: string;
}

export const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
  dropdownClassName = '',
  openDirection = 'down',
  minWidth = '120px'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar dropdown cuando se hace click fuera o se presiona Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-selector')) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative dropdown-selector ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium hover:underline transition-all duration-200 focus:outline-none"
        style={{ 
          fontFamily: 'var(--font-etiqueta)', 
          fontSize: 'var(--font-etiqueta-size)', 
          color: 'var(--color-oscuro)',
          padding: 0
        }}
      >
        {label && <span>{label}</span>}
        <span>{selectedOption?.label || value}</span>
        <IconoDesplegarAbajo 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`absolute shadow-lg z-50 ${dropdownClassName}`}
          style={{ 
            minWidth,
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 233, 211, 0.7)',
            ...(openDirection === 'up' 
              ? { bottom: '100%', left: 0, marginBottom: '4px' }
              : { top: '100%', left: 0, marginTop: '4px' }
            )
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 focus:outline-none ${
                value === option.value 
                  ? 'bg-[var(--color-oscuro)] text-white' 
                  : 'hover:bg-[var(--color-amarillo)]'
              }`}
              style={{ 
                fontFamily: 'var(--font-etiqueta)', 
                fontSize: 'var(--font-etiqueta-size)',
                color: value === option.value ? 'white' : 'var(--color-oscuro)',
                borderRadius: value === options[0].value ? '8px 8px 0 0' : value === options[options.length - 1].value ? '0 0 8px 8px' : '0'
              }}
            >
              {option.sublabel ? (
                <div className="flex justify-between items-center">
                  <span style={{ color: value === option.value ? 'white' : 'var(--color-oscuro)' }}>
                    {option.label}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: value === option.value ? 'white' : 'var(--color-oscuro)' }}
                  >
                    {option.sublabel}
                  </span>
                </div>
              ) : (
                <span style={{ color: value === option.value ? 'white' : 'var(--color-oscuro)' }}>
                  {option.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

