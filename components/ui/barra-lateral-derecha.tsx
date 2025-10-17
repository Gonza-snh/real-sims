'use client'

import { ToolbarButton } from './icon-circle-button'
import { TooltipProvider } from './tooltip'
import IconoMedia from '@/components/icons/Icono-Media.svg'
import IconoPerspectiva from '@/components/icons/Icono-Perspectiva.svg'
import IconoPintar from '@/components/icons/Icono-Pintar.svg'

interface BarraLateralDerechaProps {
  activeTool?: string
  onToolChange?: (tool: string) => void
}

export default function BarraLateralDerecha({
  activeTool = '',
  onToolChange
}: BarraLateralDerechaProps) {
  
  const handleSelect = (tool: string) => {
    if (onToolChange) {
      onToolChange(tool)
    }
  }

  return (
    <TooltipProvider>
      <div
        data-barra-lateral-derecha
        style={{
          position: 'fixed',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '50px',
          boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          padding: '5px',
          border: '1px solid rgba(239, 233, 211, 0.7)',
        }}
      >
        <ToolbarButton 
          svgIcon={IconoMedia} 
          tooltip="Subir imagen" 
          side="left" 
          selected={activeTool === "subir-imagen"} 
          onClick={() => handleSelect("subir-imagen")}
        />

        <ToolbarButton 
          svgIcon={IconoPerspectiva} 
          tooltip="Crear espacio" 
          side="left" 
          selected={activeTool === "crear-espacio"} 
          onClick={() => handleSelect("crear-espacio")}
        />

        <ToolbarButton 
          svgIcon={IconoPintar} 
          tooltip="Pintar / Revestimientos" 
          side="left" 
          selected={activeTool === "revestimientos"} 
          onClick={() => handleSelect("revestimientos")}
        />
      </div>
    </TooltipProvider>
  )
}

