'use client'

import { useState, useEffect } from 'react'
import Scene3D from '@/components/Scene3D'
import HerramientasEditor3D from '@/components/ui/herramientas-editor-3d'
import Header from '@/components/ui/header'
import BarraLateralDerecha from '@/components/ui/barra-lateral-derecha'
import ToolbarContextual from '@/components/ui/toolbar-contextual'
import InstruccionesHerramienta from '@/components/ui/instrucciones-herramienta'
import * as THREE from 'three'

type EnvironmentPreset = 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'

export default function Home() {
  const [activeTool, setActiveTool] = useState<string>('seleccionar')
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('warehouse')
  const [cameraType, setCameraType] = useState<'perspective' | 'orthographic'>('perspective')
  const [showGrid, setShowGrid] = useState<boolean>(false)
  const [selectedObject, setSelectedObject] = useState<boolean>(false)
  const [shouldDeselectObject, setShouldDeselectObject] = useState<boolean>(false)
  const [hasMultipleSelection, setHasMultipleSelection] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [isMoving, setIsMoving] = useState<boolean>(false)
  const [isRotatingTool, setIsRotatingTool] = useState<boolean>(false)
  const [cameraControl, setCameraControl] = useState<((view: 'top' | 'front' | 'right' | 'left' | 'back' | 'bottom') => void) | null>(null)

  // Deseleccionar objeto con tecla Escape (escalonado)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Prioridad 0a: Si está duplicando, cancelar duplicación
        if (isDuplicating) {
          setIsDuplicating(false)
          return
        }
        
        // Prioridad 0b: Si está moviendo, cancelar movimiento
        if (isMoving) {
          setIsMoving(false)
          return
        }
        
        // Prioridad 0c: Si está rotando, cancelar rotación
        if (isRotatingTool) {
          setIsRotatingTool(false)
          return
        }
        
        // Prioridad 1: Si hay objetos seleccionados (individual o múltiple)
        if (selectedObject || hasMultipleSelection) {
          setSelectedObject(false)
          setShouldDeselectObject(true)
          setTimeout(() => setShouldDeselectObject(false), 100)
          return
        }
        
        // Prioridad 2: Si está en marco de selección pero sin objetos seleccionados
        if (activeTool === 'marco-seleccion') {
          setActiveTool('seleccionar')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedObject, activeTool, hasMultipleSelection, isDuplicating, isMoving, isRotatingTool])

  // Detectar Command/Ctrl para activar Marco de selección, Espacio para Seleccionar y teclas numéricas para cámara
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detectar Espacio para activar Seleccionar
      if (event.code === 'Space' && activeTool !== 'seleccionar') {
        event.preventDefault()
        setActiveTool('seleccionar')
        return
      }
      
      // Detectar tecla "1" para vista TOP y cámara ortográfica
      if (event.key === '1') {
        event.preventDefault()
        console.log('🎯 Tecla "1" presionada, cameraControl:', cameraControl)
        // Cambiar a cámara ortográfica
        setCameraType('orthographic')
        // Cambiar vista a TOP
        if (cameraControl) {
          cameraControl('top')
        } else {
          console.warn('⚠️ cameraControl no está disponible aún')
        }
        return
      }
      
      // Detectar Command (Mac) o Control (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && activeTool === 'seleccionar') {
        setActiveTool('marco-seleccion')
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTool, cameraControl])

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
  const handleObjectSelection = (hasObject: boolean, isMultiple: boolean = false) => {
    setSelectedObject(hasObject && !isMultiple)
    setHasMultipleSelection(isMultiple)
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
  
  // Manejar cuando se completa la duplicación
  const handleDuplicateComplete = (objects: THREE.Object3D[], offset: THREE.Vector3) => {
    console.log('✅ Duplicación completada!')
    console.log('   Objetos a duplicar:', objects.length)
    console.log('   Offset:', offset)
    console.log('   Creando objetos duplicados...')
    
    // TODO: Cuando tengas Supabase, aquí crearás los objetos en la base de datos
    // Por ahora el sistema está listo - los objetos fantasma ya mostraron el preview
    // La integración con DemoObjects/ImportedObjects se hará cuando conectes Supabase
    
    // Desactivar modo duplicar
    setIsDuplicating(false)
    console.log('   ℹ️ Nota: La duplicación visual funciona. Falta integrar con sistema de objetos persistentes.')
  }
  
  // Manejar cuando se completa el movimiento
  const handleMoveComplete = (objects: THREE.Object3D[], offset: THREE.Vector3) => {
    console.log('✅ Movimiento completado en page.tsx!')
    console.log('   Objetos movidos:', objects.length)
    console.log('   Offset aplicado:', offset)
    
    // TODO: Cuando tengas Supabase, actualiza las posiciones en la base de datos
    // Los objetos ya fueron movidos en Scene3D
    
    // Desactivar modo mover
    setIsMoving(false)
  }
  
  // Manejar cuando se completa la rotación
  const handleRotationComplete = (objects: THREE.Object3D[], center: THREE.Vector3, angle: number) => {
    console.log('✅ Rotación completada en page.tsx!')
    console.log('   Objetos rotados:', objects.length)
    console.log('   Ángulo:', (angle * 180 / Math.PI).toFixed(1), '°')
    
    // TODO: Cuando tengas Supabase, actualiza las rotaciones en la base de datos
    // Los objetos ya fueron rotados en Scene3D
    
    // Desactivar modo rotar
    setIsRotatingTool(false)
  }

  return (
    <main>
      <Header
        sceneName="Escena de prueba"
        credits="200/200"
        onSave={() => console.log('Guardar')}
        onUndo={() => console.log('Deshacer')}
        onRedo={() => console.log('Rehacer')}
        onRender={() => console.log('Renderizar')}
        onDelete={() => console.log('Borrar')}
        onLayers={() => console.log('Capas')}
        onShare={() => console.log('Compartir')}
        onHelp={() => console.log('¿Necesitas ayuda?')}
        onClose={() => console.log('Cerrar')}
      />
      <InstruccionesHerramienta
        visible={isDuplicating || isMoving || isRotatingTool}
        texto={
          isDuplicating 
            ? "Haz click para definir el punto de inicio, luego mueve el mouse y haz click donde quieres crear las copias. Mantén Shift para modo ortogonal, Tab para ingresar distancia exacta"
            : isMoving
            ? "Haz click para definir el punto de inicio, luego mueve el mouse y haz click donde quieres mover los objetos. Mantén Shift para modo ortogonal, Tab para ingresar distancia exacta"
            : "1er click: centro de rotación. 2do click: punto inicial (Shift para línea ortogonal). 3er click: ángulo final (Shift para snap a 45°). Tab o números para ingresar ángulo exacto"
        }
      />
        <Scene3D 
          showGrid={showGrid}
          environmentPreset={environmentPreset}
          cameraType={cameraType}
          onObjectSelection={handleObjectSelection}
          shouldDeselectObject={shouldDeselectObject}
          on3DClick={handle3DClick}
          activeTool={activeTool}
          isDuplicating={isDuplicating}
          onDuplicateComplete={handleDuplicateComplete}
          isMoving={isMoving}
          onMoveComplete={handleMoveComplete}
          isRotating={isRotatingTool}
          onRotationComplete={handleRotationComplete}
          onCameraControl={(fn) => setCameraControl(() => fn)}
        />
      <HerramientasEditor3D
        activeTool={activeTool}
        onToolChange={handleToolChange}
        environmentPreset={environmentPreset}
        onEnvironmentChange={handleEnvironmentChange}
        cameraType={cameraType}
        showGrid={showGrid}
      />
      <ToolbarContextual
        visible={selectedObject || hasMultipleSelection}
        isDuplicating={isDuplicating}
        isMoving={isMoving}
        isRotating={isRotatingTool}
        onDuplicate={() => {
          console.log('Activando modo duplicar')
          setIsDuplicating(!isDuplicating)
          setIsMoving(false)
          setIsRotatingTool(false)
        }}
        onMove={() => {
          console.log('Activando modo mover')
          setIsMoving(!isMoving)
          setIsDuplicating(false)
          setIsRotatingTool(false)
        }}
        onRotate={() => {
          console.log('Activando modo rotar')
          setIsRotatingTool(!isRotatingTool)
          setIsDuplicating(false)
          setIsMoving(false)
        }}
        onDelete={() => console.log('Eliminar')}
      />
      <BarraLateralDerecha
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />
    </main>
  )
}
