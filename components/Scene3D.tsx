'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, GizmoHelper, GizmoViewcube } from '@react-three/drei'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import CameraController from './CameraController'
import SceneLighting from './SceneLighting'
import DemoObjects from './DemoObjects'
import SceneEnvironment from './SceneEnvironment'
import { SceneObjectsProvider } from '@/contexts/SceneObjectsContext'
import SelectionBoxOverlay from './SelectionBoxOverlay'
import SelectionBoxDetector from './SelectionBoxDetector'
import DuplicateGhosts from './DuplicateGhosts'
import RotationGhosts from './RotationGhosts'
import CursorPreview from './CursorPreview'
import SpaceCreator from './SpaceCreator'
import Space from './Space'

interface Scene3DProps {
  showGrid?: boolean
  environmentPreset?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'
  cameraType?: 'perspective' | 'orthographic'
  onObjectSelection?: (hasObject: boolean, isMultiple?: boolean) => void
  shouldDeselectObject?: boolean
  on3DClick?: () => void
  activeTool?: string
  isDuplicating?: boolean
  onDuplicateComplete?: (objects: THREE.Object3D[], offset: THREE.Vector3) => void
  isMoving?: boolean
  onMoveComplete?: (objects: THREE.Object3D[], offset: THREE.Vector3) => void
  isRotating?: boolean
  onRotationComplete?: (objects: THREE.Object3D[], center: THREE.Vector3, angle: number) => void
  onCameraControl?: (control: (view: 'top' | 'front' | 'right' | 'left' | 'back' | 'bottom') => void) => void
  isCreatingSpace?: boolean
  onSpaceComplete?: (space: { start: THREE.Vector3; end: THREE.Vector3; width: number; length: number; height: number }) => void
}

// Configuración de colores y apariencia del entorno
const SCENE_CONFIG = {
  colors: {
    // Colores principales
    objectColor: '#efe9d3',
    floorColor: '#242423',
    borderColor: '#F7F5EF',
    
    // Colores del grid
    gridCellColor: '#FF00FF',     // Magenta para celdas
    gridSectionColor: '#FF00FF',  // Magenta para secciones principales
  },
  
  lighting: {
    ambientIntensity: 0.4,        // Luz ambiental suave
    sunIntensity: 1.5,            // Intensidad de la luz direccional
  },
  
  materials: {
    objectMetalness: 0.2,         // Qué tan metálico es el objeto
    objectRoughness: 0.4,         // Qué tan rugoso (0=espejo, 1=mate)
  },
  
  shadows: {
    contactOpacity: 0.3,          // Opacidad de sombras de contacto
    contactBlur: 2.5,             // Suavidad de las sombras
  },

}

// Función para obtener archivo HDR local
function getEnvironmentFile(preset: string): string | undefined {
  const localFiles: Record<string, string> = {
    'warehouse': '/hdri/empty_warehouse_01_1k.hdr',
    'studio': '/hdri/studio_small_09_1k.hdr',
    'forest': '/hdri/forest_slope_1k.hdr',
    'sunset': '/hdri/venice_sunset_1k.hdr',
    'dawn': '/hdri/kiara_1_dawn_1k.hdr',
    'night': '/hdri/evening_road_01_1k.hdr',
    'city': '/hdri/urban_street_01_1k.hdr',
    'apartment': '/hdri/studio_small_08_1k.hdr',
    'park': '/hdri/forest_slope_1k.hdr',
    'lobby': '/hdri/studio_small_08_1k.hdr'
  }
  
  return localFiles[preset]
}

// Función para obtener preset de drei
function getEnvironmentPreset(preset: string): 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby' | undefined {
  // Todos los presets ahora tienen archivos locales, no usar presets de drei
  return undefined
}

export default function Scene3D({ showGrid = true, environmentPreset = 'warehouse', cameraType = 'perspective', onObjectSelection, shouldDeselectObject = false, on3DClick, activeTool = 'seleccionar', isDuplicating = false, onDuplicateComplete, isMoving = false, onMoveComplete, isRotating = false, onRotationComplete, onCameraControl, isCreatingSpace = false, onSpaceComplete }: Scene3DProps = {}) {
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<THREE.Object3D[]>([])
  const orbitControlsRef = useRef<any>(null)
  const [duplicateClickEvent, setDuplicateClickEvent] = useState<THREE.Vector3 | null>(null)
  const [moveClickEvent, setMoveClickEvent] = useState<THREE.Vector3 | null>(null)
  const [rotateClickEvent, setRotateClickEvent] = useState<THREE.Vector3 | null>(null)
  const [spaceClickEvent, setSpaceClickEvent] = useState<THREE.Vector3 | null>(null)
  const [createdSpaces, setCreatedSpaces] = useState<Array<{ start: THREE.Vector3; end: THREE.Vector3; width: number; length: number; height: number }>>([])
  
  // Función para controlar la cámara programáticamente
  const setCameraView = useCallback((view: 'top' | 'front' | 'right' | 'left' | 'back' | 'bottom') => {
    if (!orbitControlsRef.current) return
    
    const controls = orbitControlsRef.current
    const distance = 10 // Distancia fija para todas las vistas
    
    switch (view) {
      case 'top':
        // Vista desde arriba (Y+), mirando hacia abajo, norte hacia arriba (Z+)
        controls.object.position.set(0, distance, 0)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case 'front':
        // Vista frontal (Z+), norte hacia arriba
        controls.object.position.set(0, 0, distance)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case 'right':
        // Vista derecha (X+)
        controls.object.position.set(distance, 0, 0)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case 'left':
        // Vista izquierda (X-)
        controls.object.position.set(-distance, 0, 0)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case 'back':
        // Vista trasera (Z-)
        controls.object.position.set(0, 0, -distance)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case 'bottom':
        // Vista desde abajo (Y-)
        controls.object.position.set(0, -distance, 0)
        controls.object.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        break
    }
    
    controls.update()
    console.log('📷 Cámara cambiada a vista:', view)
  }, [])
  
  // Exponer la función de control de cámara al componente padre cuando esté listo
  useEffect(() => {
    if (!onCameraControl) return
    
    // Verificar si los controles ya están disponibles
    if (orbitControlsRef.current) {
      console.log('📷 Exponiendo función de control de cámara (controles ya disponibles)')
      onCameraControl(setCameraView)
      return
    }
    
    // Si no están disponibles, verificar periódicamente
    const checkControls = setInterval(() => {
      if (orbitControlsRef.current) {
        console.log('📷 OrbitControls listos, exponiendo función de control')
        onCameraControl(setCameraView)
        clearInterval(checkControls)
      }
    }, 100)
    
    return () => clearInterval(checkControls)
  }, [onCameraControl, setCameraView])
  
  // Handler para clicks con modo multi-select
  const handleObjectClick = useCallback((object: THREE.Object3D, isMultiSelectMode: boolean = false) => {
    if (isMultiSelectMode && activeTool === 'marco-seleccion') {
      // Modo multi-select: toggle objeto en la lista
      setSelectedObjects(prev => {
        const isAlreadySelected = prev.includes(object)
        if (isAlreadySelected) {
          // Quitar de la selección
          return prev.filter(obj => obj !== object)
        }
        // Agregar a la selección
        return [...prev, object]
      })
      setSelectedObject(null) // Limpiar selección individual
    } else {
      // Selección normal individual
      setSelectedObject(object)
      setSelectedObjects([]) // Limpiar selección múltiple
    }
  }, [activeTool])
  
  // Para detectar si fue click o drag
  const mouseDownPosition = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef<boolean>(false)
  
  // Para controlar rotación de objetos
  const [isRotatingObject, setIsRotatingObject] = useState<boolean>(false)
  const [isDraggingObject, setIsDraggingObject] = useState<boolean>(false)
  const [isRotatingSecondClick, setIsRotatingSecondClick] = useState<boolean>(false)
  
  // Determinar si el marco de selección está activo
  const isSelectionBoxActive = activeTool === 'marco-seleccion'
  
  // Estado para los bounds del marco de selección
  const [selectionBounds, setSelectionBounds] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null)

  // Deseleccionar cuando el padre lo indica
  useEffect(() => {
    if (shouldDeselectObject) {
      setSelectedObject(null)
      setSelectedObjects([])
    }
  }, [shouldDeselectObject])
  
  // Convertir selección individual a múltiple cuando se activa marco-seleccion
  useEffect(() => {
    if (isSelectionBoxActive && selectedObject && selectedObjects.length === 0) {
      // Hay un objeto seleccionado individualmente, convertirlo a selección múltiple
      setSelectedObjects([selectedObject])
      setSelectedObject(null)
      console.log('🔄 Convertido objeto individual a selección múltiple')
    }
  }, [isSelectionBoxActive, selectedObject, selectedObjects.length])
  
  // Limpiar selección múltiple cuando se sale de la herramienta de marco
  useEffect(() => {
    if (!isSelectionBoxActive && selectedObjects.length > 0) {
      setSelectedObjects([])
    }
  }, [isSelectionBoxActive, selectedObjects.length])

  // Notificar al padre cuando cambia la selección
  useEffect(() => {
    if (onObjectSelection) {
      const hasSelection = selectedObject !== null || selectedObjects.length > 0
      const isMultiple = selectedObjects.length > 0
      onObjectSelection(hasSelection, isMultiple)
    }
  }, [selectedObject, selectedObjects, onObjectSelection])
  
  // Manejar cuando se completa el marco de selección
  const handleSelectionComplete = (bounds: { left: number; top: number; right: number; bottom: number }) => {
    setSelectionBounds(bounds)
    // Limpiar bounds después de un frame
    setTimeout(() => setSelectionBounds(null), 100)
  }
  
  // Manejar cuando se detectan objetos en el marco
  const handleObjectsSelected = useCallback((objects: THREE.Object3D[]) => {
    if (objects.length > 0) {
      setSelectedObjects(objects)
    }
  }, [])
  
  // Obtener objetos a duplicar
  const objectsToDuplicate = selectedObjects.length > 0 ? selectedObjects : (selectedObject ? [selectedObject] : [])
  
  // Manejar cuando se completa la duplicación
  const handleDuplicateComplete = useCallback((offset: THREE.Vector3) => {
    if (onDuplicateComplete) {
      onDuplicateComplete(objectsToDuplicate, offset)
    }
  }, [objectsToDuplicate, onDuplicateComplete])
  
  // Manejar cuando se completa el movimiento
  const handleMoveComplete = useCallback((offset: THREE.Vector3) => {
    console.log('🎯 Scene3D - Moviendo objetos con offset:', offset)
    
    // Mover los objetos reales directamente aquí
    objectsToDuplicate.forEach(obj => {
      obj.position.add(offset)
      console.log('  ✅ Objeto movido a:', obj.position)
    })
    
    // Notificar al padre (por si quiere actualizar estado o Supabase)
    if (onMoveComplete) {
      onMoveComplete(objectsToDuplicate, offset)
    }
  }, [objectsToDuplicate, onMoveComplete])
  
  // Manejar cuando se completa la rotación
  const handleRotationComplete = useCallback((center: THREE.Vector3, angle: number) => {
    console.log('🎯 Scene3D - Rotando objetos:', angle, 'radianes =', (angle * 180 / Math.PI).toFixed(1), '°')
    
    // Crear un Group temporal para aplicar la rotación
    const tempGroup = new THREE.Group()
    
    // Posicionar el Group en el centro de rotación
    tempGroup.position.copy(center)
    
    // Guardar los parents originales
    const originalParents = new Map<THREE.Object3D, THREE.Object3D | null>()
    
    // Agregar los objetos al Group (esto los mueve relativos al Group)
    objectsToDuplicate.forEach(obj => {
      originalParents.set(obj, obj.parent)
      tempGroup.attach(obj)
    })
    
    // Rotar el Group (rota todos los objetos alrededor del centro)
    tempGroup.rotateY(angle)
    
    // Remover los objetos del Group y volverlos a su parent original
    objectsToDuplicate.forEach(obj => {
      const originalParent = originalParents.get(obj)
      if (originalParent) {
        originalParent.attach(obj)
      }
      console.log('  ✅ Objeto rotado a:', obj.position, 'con rotación Y:', obj.rotation.y)
    })
    
    // Notificar al padre (para desactivar modo rotar y actualizar Supabase si es necesario)
    if (onRotationComplete) {
      onRotationComplete(objectsToDuplicate, center, angle)
    }
  }, [objectsToDuplicate, onRotationComplete])

  // Manejar cuando se completa la creación de un espacio
  const handleSpaceComplete = useCallback((space: { start: THREE.Vector3; end: THREE.Vector3; width: number; length: number; height: number }) => {
    console.log('🏠 Scene3D - Espacio creado:', space)
    
    // Agregar el espacio a la lista de espacios creados
    setCreatedSpaces(prev => [...prev, space])
    
    // Notificar al padre
    if (onSpaceComplete) {
      onSpaceComplete(space)
    }
    
    // Desactivar la herramienta después de crear el espacio
    // Esto se manejará desde el componente padre
  }, [onSpaceComplete])



  return (
    <>
      <SelectionBoxOverlay 
        isActive={isSelectionBoxActive && !isDraggingObject} 
        onSelectionComplete={handleSelectionComplete}
      />
      <div 
        style={{ width: '100%', height: '100vh' }}
        onMouseDown={(e) => {
          mouseDownPosition.current = { x: e.clientX, y: e.clientY }
          isDragging.current = false
        }}
        onMouseMove={(e) => {
          if (!mouseDownPosition.current) return
          
          const deltaX = Math.abs(e.clientX - mouseDownPosition.current.x)
          const deltaY = Math.abs(e.clientY - mouseDownPosition.current.y)
          
          // Si se movió más de 5px, es drag
          if (deltaX > 5 || deltaY > 5) {
            isDragging.current = true
          }
        }}
        onMouseUp={() => {
          // Resetear después de un pequeño delay
          setTimeout(() => {
            mouseDownPosition.current = null
            isDragging.current = false
          }, 10)
        }}
      >
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#242423' }}
        onClick={(e) => {
          // Notificar al padre que se hizo click en el 3D
          if (on3DClick) {
            on3DClick()
          }
          
          // Click en el fondo deselecciona
          if (e.target === e.currentTarget) {
            setSelectedObject(null)
            setSelectedObjects([])
          }
        }}
        onPointerMissed={() => {
          setSelectedObject(null)
          setSelectedObjects([])
        }}
      >
        {/* Provider para detección de colisiones entre objetos */}
        <SceneObjectsProvider>
          {/* Detector de objetos en marco de selección */}
          <SelectionBoxDetector
            selectionBounds={selectionBounds}
            onObjectsSelected={handleObjectsSelected}
          />
          
          {/* Sistema de duplicación con fantasmas */}
          <DuplicateGhosts
            isActive={isDuplicating}
            objectsToDuplicate={objectsToDuplicate}
            onDuplicateComplete={handleDuplicateComplete}
            onClickEvent={duplicateClickEvent}
            showGrid={showGrid}
          />
          
          {/* Sistema de movimiento con fantasmas */}
          <DuplicateGhosts
            isActive={isMoving}
            objectsToDuplicate={objectsToDuplicate}
            onDuplicateComplete={handleMoveComplete}
            onClickEvent={moveClickEvent}
            showGrid={showGrid}
          />
          
          {/* Sistema de rotación con fantasmas y arco visual */}
          <RotationGhosts
            isActive={isRotating}
            objectsToRotate={objectsToDuplicate}
            onRotationComplete={handleRotationComplete}
            onClickEvent={rotateClickEvent}
            showGrid={showGrid}
            onSecondClickStateChange={setIsRotatingSecondClick}
          />
          
          {/* Sistema de creación de espacios */}
          <SpaceCreator
            isActive={isCreatingSpace}
            onClickEvent={spaceClickEvent}
            onSpaceComplete={handleSpaceComplete}
            showGrid={showGrid}
            spaceHeight={2.5}
          />
          
          {/* Espacios creados */}
          {createdSpaces.map((space, index) => (
            <Space
              key={index}
              start={space.start}
              end={space.end}
              width={space.width}
              length={space.length}
              height={space.height}
            />
          ))}
          
          {/* Previsualización del cursor con snap */}
          <CursorPreview 
            showGrid={showGrid}
            isActive={isDuplicating || isMoving || isRotating || isCreatingSpace}
            isRotatingSecondClick={isRotatingSecondClick}
          />
          
          {/* Iluminación de la escena */}
          <SceneLighting
            ambientIntensity={SCENE_CONFIG.lighting.ambientIntensity}
            sunIntensity={SCENE_CONFIG.lighting.sunIntensity}
          />
        
                 {/* Objetos de demostración - TODO: Reemplazar con datos de Supabase */}
                 <DemoObjects
                   objectColor={SCENE_CONFIG.colors.objectColor}
                   objectMetalness={SCENE_CONFIG.materials.objectMetalness}
                   objectRoughness={SCENE_CONFIG.materials.objectRoughness}
                   onObjectClick={handleObjectClick}
                   on3DClick={on3DClick}
                   selectedObject={selectedObject}
                   selectedObjects={selectedObjects}
                   hideHandles={isDuplicating || isMoving || isRotating || activeTool === 'marco-seleccion'}
                   onRotationStart={() => {
                     setIsRotatingObject(true)
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = false
                     }
                   }}
                   onRotationEnd={() => {
                     setIsRotatingObject(false)
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = true
                     }
                   }}
                   onObjectDragStart={() => {
                     setIsDraggingObject(true)
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = false
                     }
                   }}
                   onObjectDragEnd={() => {
                     setIsDraggingObject(false)
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = true
                     }
                   }}
                   onScaleStart={() => {
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = false
                     }
                   }}
                   onScaleEnd={() => {
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = true
                     }
                   }}
                   interactionsDisabled={false}
                   showGrid={showGrid}
                 />

        {/* Entorno: suelo, bordes, grid y sombras */}
        <SceneEnvironment
          floorColor={SCENE_CONFIG.colors.floorColor}
          borderColor={SCENE_CONFIG.colors.borderColor}
          gridCellColor={SCENE_CONFIG.colors.gridCellColor}
          gridSectionColor={SCENE_CONFIG.colors.gridSectionColor}
          showGrid={showGrid}
          contactShadowsOpacity={SCENE_CONFIG.shadows.contactOpacity}
          contactShadowsBlur={SCENE_CONFIG.shadows.contactBlur}
          onFloorClick={(point) => {
            // Si estamos en modo duplicar o mover o rotar, capturar el punto 3D
            if (isDuplicating && point) {
              console.log('📍 Click capturado para duplicar:', point)
              setDuplicateClickEvent(new THREE.Vector3(point.x, point.y, point.z))
              // Reset después de un frame para permitir múltiples clicks
              setTimeout(() => setDuplicateClickEvent(null), 50)
              return
            }
            
            if (isMoving && point) {
              console.log('📍 Click capturado para mover:', point)
              setMoveClickEvent(new THREE.Vector3(point.x, point.y, point.z))
              // Reset después de un frame para permitir múltiples clicks
              setTimeout(() => setMoveClickEvent(null), 50)
              return
            }
            
            if (isRotating && point) {
              console.log('📍 Click capturado para rotar:', point)
              setRotateClickEvent(new THREE.Vector3(point.x, point.y, point.z))
              // Reset después de un frame para permitir múltiples clicks
              setTimeout(() => setRotateClickEvent(null), 50)
              return
            }
            
            if (isCreatingSpace && point) {
              console.log('📍 Click capturado para crear espacio:', point)
              setSpaceClickEvent(new THREE.Vector3(point.x, point.y, point.z))
              // Reset después de un frame para permitir múltiples clicks
              setTimeout(() => setSpaceClickEvent(null), 50)
              return
            }
            
            // Comportamiento normal: deseleccionar
            if (!isDragging.current && !isRotatingObject) {
              setSelectedObject(null)
              setSelectedObjects([])
            }
          }}
        />

        {/* Entorno HDRI para reflejos realistas */}
        <Environment 
          files={getEnvironmentFile(environmentPreset)}
          preset={getEnvironmentPreset(environmentPreset)}
        />

        {/* Controlador de cámara */}
        <CameraController cameraType={cameraType} />

        {/* Controles de cámara orbital */}
        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          enableDamping={false}
          zoomSpeed={0.5}
          panSpeed={0.8}
          rotateSpeed={0.8}
          enableRotate={!isSelectionBoxActive && !isDuplicating && !isMoving && !isRotating}
          enablePan={!isSelectionBoxActive && !isDuplicating && !isMoving && !isRotating}
          enableZoom={true}
          zoomToCursor={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
        />



        {/* ViewCube - Navegación de vistas 3D */}
        <GizmoHelper
          alignment="bottom-right"
          margin={[70, 70]}
        >
          <GizmoViewcube
            opacity={0.7}
            color="#F7F5EF"
            hoverColor="white"
            textColor="black"
            strokeColor="white"
            font="20px Arial, sans-serif"
            faces={['Derecha', 'Izquierda', 'Arriba', 'Abajo', 'Frente', 'Atrás']}
          />
        </GizmoHelper>
        
        </SceneObjectsProvider>
      </Canvas>
      </div>
    </>
  )
}

