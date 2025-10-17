'use client'

import { forwardRef } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
import IconoDuplicar from '@/components/icons/Icono-Duplicar.svg'
import IconoMover from '@/components/icons/Icono-Mover.svg'
import IconoBasura from '@/components/icons/Icono-Basura.svg'
import IconoRefresh from '@/components/icons/Icono-Refresh.svg'
import React from 'react'

interface ToolbarContextualProps {
  visible: boolean
  isDuplicating?: boolean
  isMoving?: boolean
  isRotating?: boolean
  onDuplicate?: () => void
  onMove?: () => void
  onRotate?: () => void
  onDelete?: () => void
}

// Componente de botón invertido (fondo oscuro)
const InvertedToolbarButton = forwardRef<HTMLButtonElement, {
  svgIcon: React.ElementType
  tooltip: string
  onClick?: () => void
  selected?: boolean
}>(({ svgIcon, tooltip, onClick, selected = false }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gris-claro)]"
          style={{
            background: selected ? 'var(--color-gris-claro)' : 'transparent',
            color: selected ? 'var(--color-oscuro)' : 'var(--color-gris-claro)',
            border: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!selected) {
              e.currentTarget.style.background = 'var(--color-gris-claro)'
              e.currentTarget.style.color = 'var(--color-oscuro)'
            }
          }}
          onMouseLeave={(e) => {
            if (!selected) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-gris-claro)'
            }
          }}
          onMouseDown={(e) => {
            if (!selected) {
              e.currentTarget.style.border = '1px solid var(--color-gris-claro)'
            }
          }}
          onMouseUp={(e) => {
            if (!selected) {
              e.currentTarget.style.border = 'transparent'
            }
          }}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {React.createElement(svgIcon, { className: "w-4 h-4" })}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  )
})

InvertedToolbarButton.displayName = 'InvertedToolbarButton'

export default function ToolbarContextual({
  visible,
  isDuplicating = false,
  isMoving = false,
  isRotating = false,
  onDuplicate,
  onMove,
  onRotate,
  onDelete
}: ToolbarContextualProps) {
  return (
    <TooltipProvider>
      <div
        data-toolbar-contextual
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 80, // Justo encima del toolbar principal (20px bottom + 50px altura + 10px gap)
          transform: 'translateX(-50%)',
          background: 'rgba(36, 36, 35, 0.7)', // Color oscuro transparente
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '50px',
          boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
          zIndex: 9998, // Debajo del toolbar principal
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px',
          border: '1px solid rgba(239, 233, 211, 0.7)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          ...(visible ? {} : { transform: 'translateX(-50%) translateY(10px)' }),
        }}
      >
        <InvertedToolbarButton 
          svgIcon={IconoDuplicar} 
          tooltip={isDuplicating ? "Haz click para posicionar, luego click donde quieres dejarlo" : "Duplicar"} 
          onClick={onDuplicate}
          selected={isDuplicating}
        />

        <InvertedToolbarButton 
          svgIcon={IconoMover} 
          tooltip={isMoving ? "Haz click para definir inicio, luego donde quieres moverlos" : "Mover"} 
          onClick={onMove}
          selected={isMoving}
        />

        <InvertedToolbarButton 
          svgIcon={IconoRefresh} 
          tooltip="Rotar" 
          onClick={onRotate}
          selected={isRotating}
        />

        <InvertedToolbarButton 
          svgIcon={IconoBasura} 
          tooltip="Eliminar" 
          onClick={onDelete}
        />
      </div>
    </TooltipProvider>
  )
}

