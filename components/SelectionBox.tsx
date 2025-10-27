import { useEffect, useRef, useMemo, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneObjects } from '@/contexts/SceneObjectsContext'
import { checkCollisionWithObjects, tryPushObject } from '@/utils/collisionDetection'
import { snapAngleToGrid } from '@/utils/gridSnap'
import { THREE_COLORS, getSelectionLineWidth, getHandleElevation, getCornerHandleSize, getRotationHandleSize } from '@/lib/colors'

interface SelectionBoxProps {
  selectedObject: THREE.Object3D | null
  onRotationStart?: () => void
  onRotationEnd?: () => void
  onScaleStart?: () => void
  onScaleEnd?: () => void
  objectId: string  // ID del objeto para detección de colisiones
  showHandles?: boolean  // Si mostrar los handles de rotación y escala (default: true)
  showGrid?: boolean  // Si la grilla está activa para snap
}

/**
 * SelectionBox - Componente visual para objetos seleccionados
 * 
 * Muestra automáticamente un bounding box con handles interactivos para el objeto
 * seleccionado. DEBE estar anidado como hijo del objeto para que rote correctamente.
 * 
 * Features:
 * - Bounding box visual con wireframe blanco
 * - 8 handles esféricos en las esquinas (para futuro resize)
 * - Handles circulares de rotación en las 4 aristas inferiores
 * - Rotación interactiva en el eje Y con click & drag
 * - El bounding box rota junto con el objeto (porque es hijo del mismo grupo)
 */
export default function SelectionBox({ selectedObject, onRotationStart, onRotationEnd, onScaleStart, onScaleEnd, objectId, showHandles = true, showGrid = false }: SelectionBoxProps) {
  const { scene, camera } = useThree()
  const { getOtherObjects, getAllObjects } = useSceneObjects()
  const [boxBounds, setBoxBounds] = useState<THREE.Box3 | null>(null)
  const [visibleRotationHandle, setVisibleRotationHandle] = useState<number>(0)
  const [isRotating, setIsRotating] = useState<boolean>(false)
  const [isScaling, setIsScaling] = useState<boolean>(false)

  // Calcular bounding box cuando cambia el objeto seleccionado
  useEffect(() => {
    if (!selectedObject) {
      setBoxBounds(null)
      return
    }

    // IMPORTANTE: Encontrar el mesh hijo dentro del grupo (el objeto real)
    // Como SelectionBox está dentro del grupo del objeto, necesitamos calcular
    // el bounding box en coordenadas LOCALES, no mundiales
    let targetMesh: THREE.Mesh | null = null
    selectedObject.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== selectedObject) {
        targetMesh = child
      }
    })

    if (!targetMesh) {
      setBoxBounds(null)
      return
    }

    // Calcular bounding box en coordenadas LOCALES del mesh (no mundiales)
    // Usar geometry.computeBoundingBox() para obtener coordenadas locales reales
    const geometry = (targetMesh as THREE.Mesh).geometry
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!.clone() // Clonar para no modificar el original
    
    const padding = 0.05 // Padding de 5cm
    
    // Expandir el box con padding, pero no en el eje Y negativo (abajo)
    box.min.x -= padding
    box.min.z -= padding
    // box.min.y no se modifica para que quede pegado al piso
    box.max.x += padding
    box.max.y += padding
    box.max.z += padding

    setBoxBounds(box)
  }, [selectedObject])

  // Calcular esquinas del bounding box
  const corners = useMemo(() => {
    if (!boxBounds) return []
    
    const corners = [
      new THREE.Vector3(boxBounds.min.x, boxBounds.min.y, boxBounds.min.z), // Bottom front left
      new THREE.Vector3(boxBounds.max.x, boxBounds.min.y, boxBounds.min.z), // Bottom front right
      new THREE.Vector3(boxBounds.min.x, boxBounds.min.y, boxBounds.max.z), // Bottom back left
      new THREE.Vector3(boxBounds.max.x, boxBounds.min.y, boxBounds.max.z), // Bottom back right
      new THREE.Vector3(boxBounds.min.x, boxBounds.max.y, boxBounds.min.z), // Top front left
      new THREE.Vector3(boxBounds.max.x, boxBounds.max.y, boxBounds.min.z), // Top front right
      new THREE.Vector3(boxBounds.min.x, boxBounds.max.y, boxBounds.max.z), // Top back left
      new THREE.Vector3(boxBounds.max.x, boxBounds.max.y, boxBounds.max.z), // Top back right
    ]
    
    return corners
  }, [boxBounds])

  // Calcular handles de rotación en las aristas inferiores
  const rotationHandles = useMemo(() => {
    if (!boxBounds) return []
    
    const lineLength = 0.25
    // Elevar el handle ligeramente por encima del piso para que sea visible sobre superficies
    const handleElevation = getHandleElevation()
    
    const handles = [
      { 
        pos: new THREE.Vector3((boxBounds.min.x + boxBounds.max.x) / 2, boxBounds.min.y + handleElevation, boxBounds.min.z),
        direction: new THREE.Vector3(0, 0, -1),
        name: 'front'
      },
      { 
        pos: new THREE.Vector3((boxBounds.min.x + boxBounds.max.x) / 2, boxBounds.min.y + handleElevation, boxBounds.max.z),
        direction: new THREE.Vector3(0, 0, 1),
        name: 'back'
      },
      { 
        pos: new THREE.Vector3(boxBounds.min.x, boxBounds.min.y + handleElevation, (boxBounds.min.z + boxBounds.max.z) / 2),
        direction: new THREE.Vector3(-1, 0, 0),
        name: 'left'
      },
      { 
        pos: new THREE.Vector3(boxBounds.max.x, boxBounds.min.y + handleElevation, (boxBounds.min.z + boxBounds.max.z) / 2),
        direction: new THREE.Vector3(1, 0, 0),
        name: 'right'
      }
    ].map((edge, index) => ({
      ...edge,
      index,
      lineEnd: edge.pos.clone().add(edge.direction.clone().multiplyScalar(lineLength))
    }))
    
    return handles
  }, [boxBounds])


  // Actualizar handle visible basado en posición de cámara
  // NO se actualiza durante la rotación para mantener sensación de control
  // Se recalcula automáticamente cuando termina la rotación (isRotating cambia a false)
  useEffect(() => {
    // Skip si estamos rotando - mantiene el handle fijo durante la rotación
    if (!selectedObject || rotationHandles.length === 0 || isRotating) return

    const updateVisibility = () => {
      const cameraPosition = camera.position.clone()
      
      let closestIndex = 0
      let minDistance = Infinity

      rotationHandles.forEach((handle, index) => {
        // Convertir posición local del handle a coordenadas mundiales
        // IMPORTANTE: Usar selectedObject.localToWorld() para considerar la rotación del objeto
        const handleWorldPos = handle.pos.clone()
        selectedObject.localToWorld(handleWorldPos)
        const distance = cameraPosition.distanceTo(handleWorldPos)
        
        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      })

      setVisibleRotationHandle(closestIndex)
    }

    // Actualizar inmediatamente (importante para cuando termina la rotación)
    updateVisibility()
    
    // Continuar actualizando cada 100ms (para movimientos de cámara)
    const interval = setInterval(updateVisibility, 100)

    return () => clearInterval(interval)
  }, [selectedObject, camera, rotationHandles, isRotating])

  if (!selectedObject || !boxBounds) return null

  return (
    <group>
      {/* Wireframe del bounding box - rota con el objeto y escala con él */}
      <WireframeBox boxBounds={boxBounds} />
      
      {/* Handles de esquinas (esferas blancas) - Para scaling */}
      {showHandles && corners.map((corner, index) => (
        <CornerHandle 
          key={index} 
          position={corner}
          selectedObject={selectedObject}
          onScaleStart={() => {
            setIsScaling(true)
            if (onScaleStart) onScaleStart()
          }}
          onScaleEnd={() => {
            setIsScaling(false)
            if (onScaleEnd) onScaleEnd()
          }}
          objectId={objectId}
          getOtherObjects={getOtherObjects}
          getAllObjects={getAllObjects}
        />
      ))}

      {/* Handles de rotación (círculos blancos) */}
      {showHandles && rotationHandles.map((handle, index) => (
        <RotationHandle
          key={index}
          visible={index === visibleRotationHandle}
          startPos={handle.pos}
          endPos={handle.lineEnd}
          selectedObject={selectedObject}
          onRotationStart={() => {
            setIsRotating(true)
            if (onRotationStart) onRotationStart()
          }}
          onRotationEnd={() => {
            setIsRotating(false)
            if (onRotationEnd) onRotationEnd()
          }}
          objectId={objectId}
          getOtherObjects={getOtherObjects}
          getAllObjects={getAllObjects}
          showGrid={showGrid}
        />
      ))}
    </group>
  )
}

// Componente para el wireframe del bounding box usando EdgesGeometry
function WireframeBox({ boxBounds }: { boxBounds: THREE.Box3 }) {
  const wireframeGeometry = useMemo(() => {
    if (!boxBounds) return new THREE.BufferGeometry()
    
    const { min, max } = boxBounds
    const width = max.x - min.x
    const height = max.y - min.y
    const depth = max.z - min.z
    
    // Crear geometría de caja
    const boxGeometry = new THREE.BoxGeometry(width, height, depth)
    
    // Centrar la geometría en el origen
    boxGeometry.translate(0, height / 2, 0)
    
    // Crear EdgesGeometry para solo las aristas
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry)
    
    return edgesGeometry
  }, [boxBounds])

  // El wireframe SI debe escalar con el objeto para mostrar el bounding box real
  return (
    <lineSegments geometry={wireframeGeometry}>
      <lineBasicMaterial color={THREE_COLORS.seleccionLinea} linewidth={getSelectionLineWidth()} />
    </lineSegments>
  )
}

// Componente para handles de esquina
function CornerHandle({ 
  position, 
  selectedObject,
  onScaleStart,
  onScaleEnd,
  objectId,
  getOtherObjects,
  getAllObjects
}: { 
  position: THREE.Vector3
  selectedObject: THREE.Object3D | null
  onScaleStart?: () => void
  onScaleEnd?: () => void
  objectId: string
  getOtherObjects: (excludeId: string) => THREE.Object3D[]
  getAllObjects: () => THREE.Object3D[]
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isScaling, setIsScaling] = useState(false)
  const scaleStartPos = useRef<{ x: number; y: number } | null>(null)
  const initialScale = useRef<THREE.Vector3 | null>(null)
  const initialDistance = useRef<number>(0)

  // Actualizar el counter-scale en cada frame para mantener tamaño constante
  useFrame(() => {
    if (meshRef.current && selectedObject) {
      // Obtener el scale del objeto padre
      const parentScale = selectedObject.scale
      
      // Aplicar counter-scale para mantener tamaño constante
      meshRef.current.scale.set(
        1 / parentScale.x,
        1 / parentScale.y,
        1 / parentScale.z
      )
    }
  })

  // Función para manejar el inicio del scaling
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    if (!selectedObject) return

    setIsScaling(true)
    scaleStartPos.current = { x: e.clientX, y: e.clientY }
    initialScale.current = selectedObject.scale.clone()
    
    // Calcular distancia inicial desde el centro
    const center = new THREE.Vector3(0, 0, 0)
    initialDistance.current = position.distanceTo(center)

    if (onScaleStart) onScaleStart()
    document.body.style.cursor = 'grabbing'
  }

  // Effect para manejar el scaling durante el drag
  useEffect(() => {
    if (!isScaling || !selectedObject || !scaleStartPos.current || !initialScale.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!scaleStartPos.current || !initialScale.current) return

      // Calcular delta del mouse
      const deltaX = e.clientX - scaleStartPos.current.x
      const deltaY = e.clientY - scaleStartPos.current.y
      
      // Usar el movimiento total (combinando X e Y) para un scaling más intuitivo
      const totalDelta = (deltaX - deltaY) * 0.005
      
      // Calcular nuevo scale (uniforme en todas las direcciones)
      const newScaleFactor = Math.max(0.1, 1 + totalDelta) // Mínimo 10% del tamaño original
      const uniformScale = initialScale.current.x * newScaleFactor
      
      // Guardar scale anterior
      const previousScale = selectedObject.scale.clone()
      
      // Aplicar scale uniforme temporalmente
      selectedObject.scale.set(uniformScale, uniformScale, uniformScale)
      selectedObject.updateWorldMatrix(true, true)
      
      // Verificar colisiones después de escalar
      const otherObjects = getOtherObjects(objectId)
      if (otherObjects.length > 0) {
        const collidingObject = checkCollisionWithObjects(selectedObject, otherObjects, 0.02)
        
        if (collidingObject) {
          // HAY COLISIÓN al crecer → Intentar empujar el otro objeto
          const allObjects = getAllObjects()
          const pushSuccessful = tryPushObject(
            selectedObject,
            collidingObject,
            allObjects
          )
          
          if (!pushSuccessful) {
            // No se pudo empujar → Revertir scale (no puede crecer más)
            selectedObject.scale.copy(previousScale)
            selectedObject.updateWorldMatrix(true, true)
          }
          // Si pushSuccessful === true, el otro objeto se empujó
        }
      }
    }

    const handleMouseUp = () => {
      setIsScaling(false)
      scaleStartPos.current = null
      initialScale.current = null
      
      if (onScaleEnd) onScaleEnd()
      
      // Resetear hover state y cursor
      setHovered(false)
      document.body.style.cursor = 'auto'
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isScaling, selectedObject, onScaleEnd, hovered, getOtherObjects, getAllObjects, objectId])

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={(e) => {
        e.stopPropagation()
        if (!isScaling) {
          setHovered(true)
          document.body.style.cursor = 'grab'
        }
      }}
      onPointerLeave={() => {
        if (!isScaling) {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <sphereGeometry args={[getCornerHandleSize(), 16, 16]} />
      <meshBasicMaterial 
        color={hovered ? THREE_COLORS.seleccionHover : THREE_COLORS.seleccion}
        depthTest={true}
        depthWrite={true}
      />
    </mesh>
  )
}

// Componente para handles de rotación
function RotationHandle({ 
  visible, 
  startPos, 
  endPos,
  selectedObject,
  onRotationStart,
  onRotationEnd,
  objectId,
  getOtherObjects,
  getAllObjects,
  showGrid
}: { 
  visible: boolean
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  selectedObject: THREE.Object3D | null
  onRotationStart?: () => void
  onRotationEnd?: () => void
  objectId: string
  getOtherObjects: (excludeId: string) => THREE.Object3D[]
  getAllObjects: () => THREE.Object3D[]
  showGrid?: boolean
}) {
  const circleMeshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const startMouseX = useRef<number>(0)
  const startRotation = useRef<number>(0)

  // Actualizar el counter-scale SOLO en el círculo para mantener tamaño constante
  // La línea NO tiene counter-scale, por lo que escala con el objeto
  useFrame(() => {
    if (circleMeshRef.current && selectedObject) {
      // Obtener el scale del objeto padre
      const parentScale = selectedObject.scale
      
      // Aplicar counter-scale SOLO al círculo para mantener tamaño constante
      circleMeshRef.current.scale.set(
        1 / parentScale.x,
        1 / parentScale.y,
        1 / parentScale.z
      )
    }
  })

  // Manejar rotación con movimiento del mouse
  useEffect(() => {
    if (!isRotating || !selectedObject) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMouseX.current
      // Cada 100px de movimiento horizontal = 90 grados (PI/2)
      const rotationDelta = (deltaX / 100) * (Math.PI / 2)
      
      // Guardar rotación anterior
      const previousRotation = selectedObject.rotation.y
      
      // Calcular nueva rotación
      let newRotation = startRotation.current + rotationDelta
      
      // Aplicar snap a la grilla si está habilitada
      if (showGrid) {
        newRotation = snapAngleToGrid(newRotation, true)
      }
      
      // Aplicar nueva rotación temporalmente
      selectedObject.rotation.y = newRotation
      selectedObject.updateMatrixWorld(true)
      
      // Verificar colisiones después de rotar
      const otherObjects = getOtherObjects(objectId)
      if (otherObjects.length > 0) {
        const collidingObject = checkCollisionWithObjects(selectedObject, otherObjects, 0.02)
        
        if (collidingObject) {
          // HAY COLISIÓN al rotar → Intentar empujar el otro objeto
          const allObjects = getAllObjects()
          const pushSuccessful = tryPushObject(
            selectedObject,
            collidingObject,
            allObjects
          )
          
          if (!pushSuccessful) {
            // No se pudo empujar → Revertir rotación (no puede girar más)
            selectedObject.rotation.y = previousRotation
            selectedObject.updateMatrixWorld(true)
          }
          // Si pushSuccessful === true, el otro objeto se empujó
        }
      }
    }

    const handleMouseUp = () => {
      setIsRotating(false)
      setHovered(false) // Volver a blanco cuando termina la rotación
      document.body.style.cursor = 'auto'
      if (onRotationEnd) onRotationEnd()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isRotating, selectedObject, onRotationEnd, objectId, getOtherObjects, getAllObjects, showGrid])

  if (!visible) return null

  return (
    <group>
      {/* Línea perpendicular - SIN counter-scale, escala con el objeto */}
      <primitive 
        object={(() => {
          const points = [startPos, endPos]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({ 
            color: (hovered || isRotating) ? THREE_COLORS.seleccionHover : THREE_COLORS.seleccion, 
            linewidth: getSelectionLineWidth() 
          })
          return new THREE.Line(geometry, material)
        })()}
      />

      {/* Esfera de rotación - CON counter-scale para mantener tamaño constante */}
      <mesh
        ref={circleMeshRef}
        position={endPos}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'grab'
        }}
        onPointerLeave={() => {
          if (!isRotating) {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (selectedObject) {
            setIsRotating(true)
            setHovered(true) // Mantener oscuro mientras rota
            startMouseX.current = e.clientX
            startRotation.current = selectedObject.rotation.y
            document.body.style.cursor = 'grabbing'
            if (onRotationStart) onRotationStart()
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <sphereGeometry args={[getRotationHandleSize(), 16, 16]} />
        <meshBasicMaterial 
          color={(hovered || isRotating) ? THREE_COLORS.seleccionHover : THREE_COLORS.seleccion}
          depthTest={true}
          depthWrite={true}
        />
      </mesh>
    </group>
  )
}
