import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { getFloorElevation } from '@/lib/colors'

interface SpaceProps {
  start: THREE.Vector3
  end: THREE.Vector3
  width: number
  length: number
  height?: number
  color?: string
}

/**
 * Componente que representa un espacio/recinto creado
 * Muestra las paredes del recinto con líneas blancas más gruesas que la grilla
 */
export default function Space({
  start,
  end,
  width,
  length,
  height = 2.5,
  color = "#F7F5EF"
}: SpaceProps) {
  const { camera } = useThree()
  const [faceVisibility, setFaceVisibility] = useState({
    floor: true,
    ceiling: true,
    frontWall: true,
    backWall: true,
    leftWall: true,
    rightWall: true
  })
  
  // Calcular centro del espacio
  const centerX = (start.x + end.x) / 2
  const centerZ = (start.z + end.z) / 2
  const centerY = height / 2

  // Calcular esquinas
  const minX = Math.min(start.x, end.x)
  const maxX = Math.max(start.x, end.x)
  const minZ = Math.min(start.z, end.z)
  const maxZ = Math.max(start.z, end.z)
  
  // Calcular dimensiones reales
  const actualWidth = maxX - minX
  const actualLength = maxZ - minZ
  
  // Actualizar visibilidad en tiempo real
  useFrame(() => {
    const cameraPosition = camera.position
    
    // Calcular vectores normales de cada cara (hacia afuera)
    const floorNormal = new THREE.Vector3(0, -1, 0)      // Piso hacia abajo
    const ceilingNormal = new THREE.Vector3(0, 1, 0)      // Techo hacia arriba
    const frontWallNormal = new THREE.Vector3(0, 0, -1)  // Pared frontal hacia adelante
    const backWallNormal = new THREE.Vector3(0, 0, 1)    // Pared trasera hacia atrás
    const leftWallNormal = new THREE.Vector3(-1, 0, 0)   // Pared izquierda hacia izquierda
    const rightWallNormal = new THREE.Vector3(1, 0, 0)   // Pared derecha hacia derecha
    
    // Vector desde el centro del espacio hacia la cámara
    const toCamera = new THREE.Vector3(
      cameraPosition.x - centerX,
      cameraPosition.y - centerY,
      cameraPosition.z - centerZ
    ).normalize()
    
    // Una cara es visible si el ángulo entre su normal y el vector hacia la cámara es > 90°
    // Esto significa que la cara está "del lado opuesto" de donde está la cámara
    const dotProduct = (normal: THREE.Vector3) => normal.dot(toCamera)
    
    const newVisibility = {
      // Piso: visible si la cámara está arriba (producto punto negativo)
      floor: dotProduct(floorNormal) < 0,
      
      // Techo: visible si la cámara está abajo (producto punto negativo)
      ceiling: dotProduct(ceilingNormal) < 0,
      
      // Pared frontal: visible si la cámara está detrás (producto punto negativo)
      frontWall: dotProduct(frontWallNormal) < 0,
      
      // Pared trasera: visible si la cámara está adelante (producto punto negativo)
      backWall: dotProduct(backWallNormal) < 0,
      
      // Pared izquierda: visible si la cámara está a la derecha (producto punto negativo)
      leftWall: dotProduct(leftWallNormal) < 0,
      
      // Pared derecha: visible si la cámara está a la izquierda (producto punto negativo)
      rightWall: dotProduct(rightWallNormal) < 0
    }
    
    // Solo actualizar si hay cambios para evitar re-renders innecesarios
    if (JSON.stringify(newVisibility) !== JSON.stringify(faceVisibility)) {
      setFaceVisibility(newVisibility)
    }
  })
  
  console.log('🏠 Space - Dimensiones recibidas:', { width, length, height })
  console.log('🏠 Space - Puntos:', { start, end })
  console.log('🏠 Space - Dimensiones calculadas:', { actualWidth, actualLength })
  console.log('🏠 Space - Dimensiones en cm:', { 
    widthCm: actualWidth * 100, 
    lengthCm: actualLength * 100,
    heightCm: height * 100
  })
  console.log('🏠 Space - Visibilidad de caras:', faceVisibility)

  return (
    <group>
      {/* Luz interior para iluminar objetos dentro del espacio */}
      <pointLight
        position={[centerX, centerY, centerZ]}
        intensity={0.8}
        distance={Math.max(actualWidth, actualLength, height) * 2}
        decay={2}
        castShadow={false}
      />
      
      {/* Espacio con efecto The Sims dinámico - caras se ocultan según posición de cámara */}
      
      {/* Piso - cara inferior */}
      {faceVisibility.floor && (
        <mesh position={[centerX, getFloorElevation() + 0.001, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[actualWidth, actualLength]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Techo - cara superior */}
      {faceVisibility.ceiling && (
        <mesh position={[centerX, height + 0.001, centerZ]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[actualWidth, actualLength]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Pared frontal (Z mínima) */}
      {faceVisibility.frontWall && (
        <mesh position={[centerX, centerY, minZ]} receiveShadow>
          <planeGeometry args={[actualWidth, height]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Pared trasera (Z máxima) */}
      {faceVisibility.backWall && (
        <mesh position={[centerX, centerY, maxZ]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[actualWidth, height]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Pared izquierda (X mínima) */}
      {faceVisibility.leftWall && (
        <mesh position={[minX, centerY, centerZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[actualLength, height]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Pared derecha (X máxima) */}
      {faceVisibility.rightWall && (
        <mesh position={[maxX, centerY, centerZ]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[actualLength, height]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
