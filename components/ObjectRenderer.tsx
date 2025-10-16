import React from 'react'
import * as THREE from 'three'
import ImportedObject from './ImportedObject'

// Tipos para los datos de objetos desde Supabase
interface ObjectData {
  id: string
  name: string
  modelPath: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  color?: string
  metalness?: number
  roughness?: number
}

interface ObjectRendererProps {
  objects: ObjectData[]
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
 * Componente que renderiza múltiples objetos importados
 * 
 * Ejemplo de uso:
 * const objects = [
 *   {
 *     id: '1',
 *     name: 'Sofa',
 *     modelPath: '/models/sofa.glb',
 *     position: { x: 0, y: 0, z: 0 },
 *     rotation: { x: 0, y: 0, z: 0 },
 *     scale: { x: 1, y: 1, z: 1 }
 *   },
 *   {
 *     id: '2', 
 *     name: 'Table',
 *     modelPath: '/models/table.glb',
 *     position: { x: 2, y: 0, z: 1 },
 *     rotation: { x: 0, y: Math.PI/4, z: 0 },
 *     scale: { x: 1, y: 1, z: 1 }
 *   }
 * ]
 * 
 * <ObjectRenderer
 *   objects={objects}
 *   selectedObject={selectedObject}
 *   onObjectClick={handleObjectClick}
 *   on3DClick={handle3DClick}
 *   onRotationStart={handleRotationStart}
 *   onRotationEnd={handleRotationEnd}
 *   onObjectDragStart={handleDragStart}
 *   onObjectDragEnd={handleDragEnd}
 * />
 */
export default function ObjectRenderer({
  objects,
  selectedObject,
  onObjectClick,
  on3DClick,
  onRotationStart,
  onRotationEnd,
  onObjectDragStart,
  onObjectDragEnd,
  onScaleStart,
  onScaleEnd
}: ObjectRendererProps) {
  return (
    <>
      {objects.map((object) => (
        <ImportedObject
          key={object.id}
          id={object.id}
          modelPath={object.modelPath}
          position={[object.position.x, object.position.y, object.position.z]}
          rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
          scale={[object.scale.x, object.scale.y, object.scale.z]}
          selectedObject={selectedObject}
          onObjectClick={onObjectClick}
          on3DClick={on3DClick}
          onRotationStart={onRotationStart}
          onRotationEnd={onRotationEnd}
          onObjectDragStart={onObjectDragStart}
          onObjectDragEnd={onObjectDragEnd}
          onScaleStart={onScaleStart}
          onScaleEnd={onScaleEnd}
        />
      ))}
    </>
  )
}

/**
 * Hook personalizado para manejar objetos desde Supabase
 * 
 * Ejemplo de uso:
 * const { objects, loading, error } = useObjectsFromSupabase('room_id_123')
 */
export function useObjectsFromSupabase(roomId: string) {
  const [objects, setObjects] = React.useState<ObjectData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchObjects() {
      try {
        setLoading(true)
        // Aquí iría la llamada a Supabase
        // const { data, error } = await supabase
        //   .from('room_objects')
        //   .select('*')
        //   .eq('room_id', roomId)
        
        // Por ahora, datos de ejemplo
        const mockObjects: ObjectData[] = [
          {
            id: '1',
            name: 'Sofa',
            modelPath: '/models/sofa.glb',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          {
            id: '2',
            name: 'Table',
            modelPath: '/models/table.glb',
            position: { x: 2, y: 0, z: 1 },
            rotation: { x: 0, y: Math.PI/4, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          }
        ]
        
        setObjects(mockObjects)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchObjects()
  }, [roomId])

  return { objects, loading, error }
}
