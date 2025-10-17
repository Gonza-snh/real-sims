import React from 'react'
import { useThree } from '@react-three/fiber'
import { useSceneObjects } from '@/contexts/SceneObjectsContext'
import * as THREE from 'three'

interface SelectionBoxDetectorProps {
  selectionBounds: { left: number; top: number; right: number; bottom: number } | null
  onObjectsSelected: (objects: THREE.Object3D[]) => void
}

/**
 * Componente interno de R3F que detecta qué objetos están dentro del marco de selección
 * Usa la cámara para proyectar posiciones 3D a coordenadas 2D de pantalla
 */
export default function SelectionBoxDetector({ 
  selectionBounds, 
  onObjectsSelected 
}: SelectionBoxDetectorProps) {
  const { camera, size } = useThree()
  const { getAllObjects } = useSceneObjects()

  // Detectar objetos dentro del marco cuando cambian los bounds
  React.useEffect(() => {
    if (!selectionBounds) return

    const allObjects = getAllObjects()
    const selectedObjects: THREE.Object3D[] = []

    for (const object of allObjects) {
      // Obtener posición mundial del objeto
      const worldPosition = new THREE.Vector3()
      object.getWorldPosition(worldPosition)

      // Proyectar a coordenadas de pantalla (Normalized Device Coordinates)
      const projected = worldPosition.clone().project(camera)

      // Convertir NDC (-1 a 1) a coordenadas de pantalla (0 a width/height)
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = ((-projected.y) * 0.5 + 0.5) * size.height
      
      // Verificar si está dentro del rectángulo de selección
      if (
        x >= selectionBounds.left &&
        x <= selectionBounds.right &&
        y >= selectionBounds.top &&
        y <= selectionBounds.bottom &&
        projected.z < 1 // Asegurar que está delante de la cámara
      ) {
        selectedObjects.push(object)
      }
    }
    
    // Notificar objetos seleccionados
    onObjectsSelected(selectedObjects)
  }, [selectionBounds, camera, size.width, size.height, getAllObjects, onObjectsSelected])

  return null
}

