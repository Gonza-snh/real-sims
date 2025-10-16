'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, GizmoHelper, GizmoViewcube } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import CameraController from './CameraController'
import SceneLighting from './SceneLighting'
import DemoObjects from './DemoObjects'
import SceneEnvironment from './SceneEnvironment'
import { SceneObjectsProvider } from '@/contexts/SceneObjectsContext'

interface Scene3DProps {
  showGrid?: boolean
  environmentPreset?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'
  cameraType?: 'perspective' | 'orthographic'
  onObjectSelection?: (hasObject: boolean) => void
  shouldDeselectObject?: boolean
  on3DClick?: () => void
}

// Configuración de colores y apariencia del entorno
const SCENE_CONFIG = {
  colors: {
    // Colores principales
    objectColor: '#efe9d3',
    floorColor: '#242423',
    borderColor: '#F7F5EF',
    
    // Colores del grid
    gridCellColor: '#F7F5EF',     // Gris medio para celdas
    gridSectionColor: '#F7F5EF',  // Negro para secciones principales
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

export default function Scene3D({ showGrid = true, environmentPreset = 'warehouse', cameraType = 'perspective', onObjectSelection, shouldDeselectObject = false, on3DClick }: Scene3DProps = {}) {
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null)
  const orbitControlsRef = useRef<any>(null)
  
  // Para detectar si fue click o drag
  const mouseDownPosition = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef<boolean>(false)
  
  // Para controlar rotación de objetos
  const [isRotatingObject, setIsRotatingObject] = useState<boolean>(false)

  // Deseleccionar cuando el padre lo indica
  useEffect(() => {
    if (shouldDeselectObject) {
      setSelectedObject(null)
    }
  }, [shouldDeselectObject])

  // Notificar al padre cuando cambia la selección
  useEffect(() => {
    if (onObjectSelection) {
      onObjectSelection(selectedObject !== null)
    }
  }, [selectedObject, onObjectSelection])



  return (
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
          }
        }}
        onPointerMissed={() => {
          setSelectedObject(null)
        }}
      >
        {/* Provider para detección de colisiones entre objetos */}
        <SceneObjectsProvider>
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
                   onObjectClick={setSelectedObject}
                   on3DClick={on3DClick}
                   selectedObject={selectedObject}
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
                     if (orbitControlsRef.current) {
                       orbitControlsRef.current.enabled = false
                     }
                   }}
                   onObjectDragEnd={() => {
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
          onFloorClick={() => {
            if (!isDragging.current && !isRotatingObject) {
              setSelectedObject(null)
            }
          }}
        />

        {/* Entorno HDRI para reflejos realistas */}
        <Environment preset={environmentPreset} />

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
        />



        {/* ViewCube - Navegación de vistas 3D */}
        <GizmoHelper
          alignment="bottom-right"
          margin={[70, 70]}
        >
          <GizmoViewcube
            opacity={0.6}
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
  )
}

