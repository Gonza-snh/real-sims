'use client'

import { useState, useEffect } from 'react'
import Scene3D from '@/components/Scene3D'
import HerramientasEditor3D from '@/components/ui/herramientas-editor-3d'

type EnvironmentPreset = 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'

export default function Home() {
  const [activeTool, setActiveTool] = useState<string>('seleccionar')
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('warehouse')
  const [cameraType, setCameraType] = useState<'perspective' | 'orthographic'>('perspective')
  const [showGrid, setShowGrid] = useState<boolean>(false)
  const [selectedObject, setSelectedObject] = useState<boolean>(false)
  const [shouldDeselectObject, setShouldDeselectObject] = useState<boolean>(false)

  // Deseleccionar objeto con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Si hay un objeto seleccionado, deseleccionarlo
        if (selectedObject) {
          setSelectedObject(false)
          setActiveTool('seleccionar')
          setShouldDeselectObject(true)
          
          // Reset shouldDeselectObject después de un pequeño delay
          setTimeout(() => setShouldDeselectObject(false), 100)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedObject])

  const handleToolChange = (tool: string) => {
    // Botones Toggle - no usan activeTool, tienen su propio estado
    if (tool === 'grilla') {
      setShowGrid(prev => !prev)
      return
    }

    if (tool === 'perspectiva') {
      setCameraType(prev => prev === 'perspective' ? 'orthographic' : 'perspective')
      return
    }

    // Herramienta Seleccionar - NO es toggle, siempre se activa
    if (tool === 'seleccionar') {
      // Solo actualizar si no está ya activo (evita re-renders innecesarios)
      if (activeTool !== 'seleccionar') {
        setActiveTool('seleccionar')
      }
      return
    }

    // Botones de acción normal (como iluminación) - NO son toggle
    // Si hay un objeto seleccionado, deseleccionarlo al cambiar a una herramienta no booleana
    if (selectedObject) {
      setSelectedObject(false)
      setShouldDeselectObject(true)
      setTimeout(() => setShouldDeselectObject(false), 100)
    }
    
    // Iluminación NO es toggle - siempre se activa cuando se hace click
    // Solo actualizar si no está ya activo (evita re-renders innecesarios)
    if (tool === 'iluminacion') {
      if (activeTool !== 'iluminacion') {
        setActiveTool('iluminacion')
      }
      return
    }
    
    // Para cualquier otra herramienta futura, usar toggle por defecto
    const newTool = activeTool === tool ? 'seleccionar' : tool
    setActiveTool(newTool)
  }

  // Callback para cuando Scene3D notifica que se seleccionó un objeto
  const handleObjectSelection = (hasObject: boolean) => {
    setSelectedObject(hasObject)
    // NO cambiar automáticamente a "seleccionar" - solo actualizar el estado
  }

  // Callback para cuando se hace click en el 3D (fuera del toolbar)
  const handle3DClick = () => {
    // Si estamos en una herramienta no booleana (como iluminación), volver a seleccionar
    const nonBooleanTools = ['iluminacion'] // Agregar aquí más herramientas no booleanas en el futuro
    if (nonBooleanTools.includes(activeTool)) {
      setActiveTool('seleccionar')
    }
  }

  const handleEnvironmentChange = (preset: string | number) => {
    setEnvironmentPreset(preset as EnvironmentPreset)
  }

  return (
    <main>
      <Scene3D 
        showGrid={showGrid} 
        environmentPreset={environmentPreset}
        cameraType={cameraType}
        onObjectSelection={handleObjectSelection}
        shouldDeselectObject={shouldDeselectObject}
        on3DClick={handle3DClick}
      />
      <HerramientasEditor3D
        activeTool={activeTool}
        onToolChange={handleToolChange}
        environmentPreset={environmentPreset}
        onEnvironmentChange={handleEnvironmentChange}
        cameraType={cameraType}
        showGrid={showGrid}
      />
    </main>
  )
}
