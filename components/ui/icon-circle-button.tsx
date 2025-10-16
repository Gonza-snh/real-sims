import React, { forwardRef } from "react";

interface IconCircleButtonLightProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  svgIcon?: React.ElementType;
  selected?: boolean;
  className?: string;
}

export const IconCircleButtonLight = forwardRef<HTMLButtonElement, IconCircleButtonLightProps>(({
  icon,
  svgIcon,
  selected = false,
  disabled = false,
  className = "",
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-150
        ${selected 
          ? "bg-[var(--color-oscuro)] text-[var(--color-gris-claro)] border-transparent" 
          : "bg-transparent text-[var(--color-oscuro)] border-transparent hover:bg-[var(--color-oscuro)] hover:text-[var(--color-gris-claro)]"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-oscuro)]
        boton-circular
        ${className}
      `}
      onMouseDown={(e) => {
        // Solo aplicar efectos de click si NO está seleccionado
        if (!disabled && !selected) {
          e.currentTarget.style.border = '1px solid var(--color-oscuro)'
          e.currentTarget.style.color = 'var(--color-oscuro)'
        }
      }}
      onMouseUp={(e) => {
        // Solo limpiar efectos de click si NO está seleccionado
        if (!disabled && !selected) {
          e.currentTarget.style.border = 'transparent'
          // Limpiar estilos inline para que las clases CSS tomen control
          e.currentTarget.style.removeProperty('color')
        }
      }}
      style={{
        ...props.style,
      }}
      {...props}
    >
      {svgIcon ? <span className="w-4 h-4 flex items-center justify-center">{React.createElement(svgIcon, { className: "w-4 h-4" })}</span> : icon}
    </button>
  );
}); 

IconCircleButtonLight.displayName = 'IconCircleButtonLight';

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ToolbarButtonProps {
  svgIcon: any;
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  selected?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  ariaLabel?: string;
  iconRotation?: number; // Rotación del icono en grados
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(({
  svgIcon,
  tooltip,
  side = "top",
  selected = false,
  disabled = false,
  onClick,
  style,
  ariaLabel,
  iconRotation,
}, ref) => {
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
  }
  // Crear componente con rotación si se especifica
  const RotatedIcon = iconRotation ? (props: any) => {
    const Icon = svgIcon;
    return (
      <div style={{ transform: `rotate(${iconRotation}deg)`, display: 'inline-flex' }}>
        <Icon {...props} />
      </div>
    );
  } : svgIcon;

  const button = (
    <IconCircleButtonLight
      ref={ref}
      svgIcon={RotatedIcon}
      aria-label={ariaLabel || tooltip}
      selected={selected}
      disabled={disabled}
      style={{
        ...(selected ? { background: 'var(--color-oscuro)', color: '#fff' } : {}),
        ...style,
      }}
      onClick={handleClick}
    />
  );

  // Solo mostrar tooltip si no está deshabilitado
  if (disabled) {
    return <span>{button}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{button}</span>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});

ToolbarButton.displayName = 'ToolbarButton';
