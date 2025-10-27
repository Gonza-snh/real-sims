import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { snapToGrid } from '@/utils/gridSnap'
import { getSelectionColor } from '@/lib/colors'

interface CursorPreviewProps {
  showGrid: boolean
  isActive: boolean  // Solo mostrar cuando hay herramientas activas
  isRotatingSecondClick?: boolean  // Si estamos en el segundo click de rotación
}

/**
 * Componente que muestra una previsualización del cursor con snap a la grilla
 * Aparece como un punto pequeño que sigue el mouse y se ajusta a la grilla
 */
export default function CursorPreview({ showGrid, isActive, isRotatingSecondClick = false }: CursorPreviewProps) {
  const { camera, raycaster } = useThree()
  const [cursorPosition, setCursorPosition] = useState<THREE.Vector3 | null>(null)

  useEffect(() => {
    if (!isActive || isRotatingSecondClick) {
      setCursorPosition(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      let mousePoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeY, mousePoint)

      if (mousePoint) {
        // Aplicar snap a la grilla si está habilitada
        const snappedPoint = snapToGrid(mousePoint, showGrid)
        setCursorPosition(snappedPoint)
      } else {
        setCursorPosition(null)
      }
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove)
      return () => canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [camera, raycaster, showGrid, isActive, isRotatingSecondClick])

  if (!cursorPosition) return null

  return (
    <mesh position={cursorPosition}>
      <sphereGeometry args={[0.01, 12, 12]} />
      <meshBasicMaterial 
        color={getSelectionColor()}
        transparent 
        opacity={0.9}
      />
    </mesh>
  )
}
