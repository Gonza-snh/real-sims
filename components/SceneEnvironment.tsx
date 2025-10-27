import { ContactShadows, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { snapToGrid } from '@/utils/gridSnap'
import { getFloorElevation } from '@/lib/colors'

interface SceneEnvironmentProps {
  floorColor: string
  borderColor: string
  gridCellColor: string
  gridSectionColor: string
  showGrid: boolean
  contactShadowsOpacity: number
  contactShadowsBlur: number
  onFloorClick?: (point?: THREE.Vector3) => void
}

/**
 * Componente de entorno de la escena 3D
 * Incluye suelo, bordes, grid opcional y sombras de contacto
 */
export default function SceneEnvironment({
  floorColor,
  borderColor,
  gridCellColor,
  gridSectionColor,
  showGrid,
  contactShadowsOpacity,
  contactShadowsBlur,
  onFloorClick
}: SceneEnvironmentProps) {
  
  // Función helper para manejar clicks con snap a la grilla
  const handleFloorClick = (point: THREE.Vector3) => {
    if (onFloorClick) {
      // Aplicar snap a la grilla si está habilitada
      const snappedPoint = snapToGrid(point, showGrid)
      onFloorClick(snappedPoint)
    }
  }
  return (
    <>
      {/* Suelo gris opaco */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, getFloorElevation(), 0]} 
        receiveShadow
        onClick={(e) => {
          console.log('⬛ CLICK EN SUELO')
          e.stopPropagation()
          handleFloorClick(e.point)
        }}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Contorno del área (borde simple y fino) */}
      <group>
        {/* Borde superior */}
        <mesh 
          position={[0, 0.001, -10]}
          onClick={(e) => {
            e.stopPropagation()
            handleFloorClick(e.point)
          }}
        >
          <boxGeometry args={[20, 0.001, 0.005]} />
          <meshBasicMaterial color={gridCellColor} />
        </mesh>
        {/* Borde inferior */}
        <mesh 
          position={[0, 0.001, 10]}
          onClick={(e) => {
            e.stopPropagation()
            handleFloorClick(e.point)
          }}
        >
          <boxGeometry args={[20, 0.001, 0.005]} />
          <meshBasicMaterial color={gridCellColor} />
        </mesh>
        {/* Borde izquierdo */}
        <mesh 
          position={[-10, 0.001, 0]}
          onClick={(e) => {
            e.stopPropagation()
            handleFloorClick(e.point)
          }}
        >
          <boxGeometry args={[0.005, 0.001, 20]} />
          <meshBasicMaterial color={gridCellColor} />
        </mesh>
        {/* Borde derecho */}
        <mesh 
          position={[10, 0.001, 0]}
          onClick={(e) => {
            e.stopPropagation()
            handleFloorClick(e.point)
          }}
        >
          <boxGeometry args={[0.005, 0.001, 20]} />
          <meshBasicMaterial color={gridCellColor} />
        </mesh>
      </group>

      {/* Grid (opcional) */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.1}
          cellThickness={0.5}
          cellColor={gridCellColor}
          sectionSize={1.0}
          sectionThickness={1}
          sectionColor={gridSectionColor}
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Sombras de contacto suaves - Deshabilitadas temporalmente */}
      {/* <ContactShadows
        position={[0, getFloorElevation() + 0.001, 0]}
        opacity={contactShadowsOpacity}
        scale={10}
        blur={contactShadowsBlur}
        far={2}
      /> */}
    </>
  )
}

