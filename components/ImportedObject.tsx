import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import SelectionBox from './SelectionBox'
import SelectableObject from './SelectableObject'

interface ImportedObjectProps {
  id: string  // ID único del objeto (para colisiones y registro)
  modelPath: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  selectedObject: THREE.Object3D | null
  onObjectClick: (object: THREE.Group) => void
  on3DClick?: () => void
  onRotationStart?: () => void
  onRotationEnd?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
  onScaleStart?: () => void
  onScaleEnd?: () => void
}

/**
 * Componente para objetos importados (SketchUp, Blender, etc.)
 * 
 * Ejemplo de uso:
 * <ImportedObject
 *   modelPath="/models/sofa.glb"
 *   position={[1, 0, 2]}
 *   selectedObject={selectedObject}
 *   onObjectClick={handleObjectClick}
 *   on3DClick={handle3DClick}
 *   onRotationStart={handleRotationStart}
 *   onRotationEnd={handleRotationEnd}
 *   onObjectDragStart={handleDragStart}
 *   onObjectDragEnd={handleDragEnd}
 * />
 */
export default function ImportedObject({
  id,
  modelPath,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selectedObject,
  onObjectClick,
  on3DClick,
  onRotationStart,
  onRotationEnd,
  onObjectDragStart,
  onObjectDragEnd,
  onScaleStart,
  onScaleEnd
}: ImportedObjectProps) {
  const objectRef = useRef<THREE.Group>(null!)
  
  // Cargar el modelo 3D
  const { scene } = useGLTF(modelPath)

  return (
    <SelectableObject
      objectId={id}
      objectRef={objectRef}
      selectedObject={selectedObject}
      onObjectClick={onObjectClick}
      on3DClick={on3DClick}
      onObjectDragStart={onObjectDragStart}
      onObjectDragEnd={onObjectDragEnd}
    >
      <group 
        ref={objectRef} 
        position={position}
        rotation={rotation}
        scale={scale}
      >
        {/* Clonar la escena del modelo importado */}
        <primitive object={scene.clone()} />
        
        {/* SelectionBox solo si este objeto está seleccionado */}
        {selectedObject === objectRef.current && (
          <SelectionBox
            selectedObject={selectedObject}
            onRotationStart={onRotationStart}
            onRotationEnd={onRotationEnd}
            onScaleStart={onScaleStart}
            onScaleEnd={onScaleEnd}
            objectId={id}
          />
        )}
      </group>
    </SelectableObject>
  )
}

// Precargar modelos para mejor rendimiento
useGLTF.preload('/models/sofa.glb')
useGLTF.preload('/models/table.glb')
useGLTF.preload('/models/chair.glb')
