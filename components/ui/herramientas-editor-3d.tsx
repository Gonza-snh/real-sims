'use client'

import { ToolbarButton } from './icon-circle-button'
import { TooltipProvider } from './tooltip'
import { DropdownSelector } from './dropdown-selector'
import IconoGrilla from '@/components/icons/Icono-Grilla.svg'
import IconoSol from '@/components/icons/Icono-Sol.svg'
import IconoMedidas from '@/components/icons/Icono-Medidas.svg'
import IconoEnviar from '@/components/icons/Icono-Enviar.svg'

interface HerramientasEditor3DProps {
  onToolChange?: (toolId: string) => void
  activeTool?: string
  environmentPreset?: string
  onEnvironmentChange?: (preset: string | number) => void
  cameraType?: 'perspective' | 'orthographic'
  showGrid?: boolean
}

const LIGHTING_OPTIONS = [
  { value: 'warehouse', label: 'Taller' },
  { value: 'studio', label: 'Estudio' },
  { value: 'sunset', label: 'Atardecer' },
  { value: 'dawn', label: 'Amanecer' },
  { value: 'night', label: 'Noche' },
  { value: 'forest', label: 'Bosque' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'city', label: 'Ciudad' },
  { value: 'park', label: 'Parque' },
  { value: 'lobby', label: 'Vestíbulo' },
]

export default function HerramientasEditor3D({ 
  onToolChange, 
  activeTool = '',
  environmentPreset = 'warehouse',
  onEnvironmentChange,
  cameraType = 'perspective',
  showGrid = false
}: HerramientasEditor3DProps) {
  
  const handleSelect = (tool: string) => {
    if (onToolChange) {
      onToolChange(tool)
    }
  }

  return (
    <TooltipProvider>
      <div
        data-toolbar-barra
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '50px',
          boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px',
          border: '1px solid rgba(239, 233, 211, 0.7)',
        }}>
        
        <ToolbarButton 
          svgIcon={IconoEnviar} 
          tooltip="Seleccionar" 
          side="top" 
          selected={activeTool === "seleccionar" || activeTool === ''} 
          onClick={() => handleSelect("seleccionar")}
        />

        <ToolbarButton 
          svgIcon={IconoMedidas} 
          tooltip="Marco de selección" 
          side="top" 
          selected={activeTool === "marco-seleccion"} 
          onClick={() => handleSelect("marco-seleccion")}
        />

        <ToolbarButton 
          svgIcon={IconoGrilla} 
          tooltip={showGrid ? 'Ocultar Grilla' : 'Mostrar Grilla'} 
          side="top" 
          selected={showGrid} 
          onClick={() => handleSelect("grilla")}
        />

        <ToolbarButton 
          svgIcon={IconoMedidas} 
          tooltip={cameraType === 'perspective' ? 'Cambiar a Ortográfica' : 'Cambiar a Perspectiva'} 
          side="top" 
          selected={cameraType === 'orthographic'} 
          onClick={() => handleSelect("perspectiva")}
        />
        
        <ToolbarButton 
          svgIcon={IconoSol} 
          tooltip="Iluminación" 
          side="top" 
          selected={activeTool === "iluminacion"} 
          onClick={() => handleSelect("iluminacion")}
        />

        {/* Dropdown de iluminación - aparece cuando iluminacion está activo */}
        {activeTool === "iluminacion" && onEnvironmentChange && (
          <div style={{ marginLeft: '10px' }}>
            <DropdownSelector
              value={environmentPreset}
              options={LIGHTING_OPTIONS}
              onChange={onEnvironmentChange}
              openDirection="up"
              minWidth="150px"
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}