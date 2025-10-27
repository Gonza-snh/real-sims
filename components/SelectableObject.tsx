import React, { useRef, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneObjects, useObjectRegistration } from '@/contexts/SceneObjectsContext'
import { checkCollisionWithObjects, placeObjectOnTop, hasObjectOnTop } from '@/utils/collisionDetection'
import { snapToGrid } from '@/utils/gridSnap'

interface SelectableObjectProps {
  children: React.ReactNode
  objectRef: React.RefObject<THREE.Group>
  selectedObject: THREE.Object3D | null
  selectedObjects?: THREE.Object3D[]  // Objetos seleccionados en grupo
  onObjectClick: (object: THREE.Group, isMultiSelectMode?: boolean) => void
  on3DClick?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
  objectId: string  // ID único para registro y detección de colisiones
  interactionsDisabled?: boolean  // Deshabilitar todas las interacciones
  hasObjectOnTopProp?: boolean  // Indicador externo de que tiene objeto encima
  showGrid?: boolean  // Si la grilla está activa para snap
}

const SelectableObject: React.FC<SelectableObjectProps> = ({
  children,
  objectRef,
  selectedObject,
  selectedObjects = [],
  onObjectClick,
  on3DClick,
  onObjectDragStart,
  onObjectDragEnd,
  objectId,
  interactionsDisabled = false,
  showGrid = false
}) => {
  const { camera } = useThree()
  const { getOtherObjects, getAllObjects } = useSceneObjects()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<THREE.Vector3 | null>(null)
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number } | null>(null)

  // Auto-registrar este objeto en el context
  useObjectRegistration(objectId, objectRef)

  // Función para manejar el inicio del drag
  const handleDragStart = useCallback((ref: React.RefObject<THREE.Group>, e: any) => {
    const isInGroup = selectedObjects.includes(ref.current!)
    if (!ref.current || (selectedObject !== ref.current && !isInGroup)) return
    
    // Solo verificar si tiene algo encima si NO está en selección múltiple
    if (!isInGroup && selectedObjects.length === 0) {
      const allObjects = getAllObjects()
      if (hasObjectOnTop(ref.current, allObjects)) {
        // No permitir drag si tiene algo encima (solo en selección individual)
        return
      }
    }
    
    setIsDragging(true)
    setDragStartPos(ref.current.position.clone())
    setDragStartMouse({ x: e.clientX, y: e.clientY })
    
    if (onObjectDragStart) onObjectDragStart()
    
    // Cambiar cursor a grabbing
    document.body.style.cursor = 'grabbing'
  }, [selectedObject, selectedObjects, onObjectDragStart, getAllObjects])

  // Función para manejar el movimiento durante el drag
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartPos || !dragStartMouse || !objectRef.current) return

    const sensitivity = 0.01
    const deltaX = (e.clientX - dragStartMouse.x) * sensitivity
    const deltaY = (e.clientY - dragStartMouse.y) * sensitivity

    // Proyección en el plano XZ basada en la orientación de la cámara
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))
    right.normalize()
    
    const moveX = deltaX * right.x - deltaY * forward.x
    const moveZ = deltaX * right.z - deltaY * forward.z
    
    // Si hay múltiples objetos seleccionados, mover todos
    if (selectedObjects.length > 0 && selectedObjects.includes(objectRef.current)) {
      // Mover todos los objetos del grupo
      for (const obj of selectedObjects) {
        if (obj instanceof THREE.Group) {
          const newPos = new THREE.Vector3(
            obj.position.x + moveX,
            obj.position.y,
            obj.position.z + moveZ
          )
          
          // Aplicar snap a la grilla si está habilitada
          const snappedPos = snapToGrid(newPos, showGrid)
          
          obj.position.x = snappedPos.x
          obj.position.z = snappedPos.z
          obj.updateWorldMatrix(true, true)
        }
      }
      // Actualizar posición inicial para el siguiente frame
      setDragStartMouse({ x: e.clientX, y: e.clientY })
    } else {
      // Mover solo el objeto individual
      const newPos = new THREE.Vector3(
        dragStartPos.x + moveX,
        0,
        dragStartPos.z + moveZ
      )
      
      // Aplicar snap a la grilla si está habilitada
      const snappedPos = snapToGrid(newPos, showGrid)
      
      objectRef.current.position.x = snappedPos.x
      objectRef.current.position.z = snappedPos.z
      objectRef.current.position.y = 0
      objectRef.current.updateWorldMatrix(true, true)
      
      // Verificar colisiones solo para movimiento individual
      const otherObjects = getOtherObjects(objectId)
      if (otherObjects.length > 0) {
        const collidingObject = checkCollisionWithObjects(objectRef.current, otherObjects, 0.02)
        
        if (collidingObject) {
          const newY = placeObjectOnTop(objectRef.current, collidingObject)
          objectRef.current.position.y = newY
          objectRef.current.updateWorldMatrix(true, true)
        }
      }
    }
  }, [isDragging, dragStartPos, dragStartMouse, objectRef, camera, getOtherObjects, objectId, selectedObjects, showGrid])

  // Función para manejar el fin del drag
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    
    // Con bloqueo hard durante drag, ya no hay colisiones al soltar
    // El objeto nunca pudo entrar en zona de colisión
    
    setIsDragging(false)
    setDragStartPos(null)
    setDragStartMouse(null)
    
    if (onObjectDragEnd) onObjectDragEnd()
    
    // Restaurar cursor a grab (porque el objeto sigue seleccionado)
    document.body.style.cursor = 'grab'
  }, [isDragging, onObjectDragEnd])

  // Event listeners globales para el drag
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Efecto para manejar cambios en la selección del objeto
  React.useEffect(() => {
    // Si no hay objeto seleccionado, restaurar cursor
    if (!selectedObject && !isDragging) {
      document.body.style.cursor = 'auto'
    }
  }, [selectedObject, isDragging])

  // Función para manejar click en el objeto
  const handleClick = useCallback((e: any) => {
    // Detectar si Command (Mac) o Control (Windows) está presionado
    const isMultiSelectKey = e.metaKey || e.ctrlKey
    
    if (interactionsDisabled && !isMultiSelectKey) {
      e.stopPropagation()
      return
    }
    
    // Solo verificar si tiene algo encima cuando NO está en modo multi-select y NO hay selección múltiple
    if (!isMultiSelectKey && selectedObjects.length === 0 && objectRef.current) {
      const allObjects = getAllObjects()
      if (hasObjectOnTop(objectRef.current, allObjects)) {
        e.stopPropagation()
        return
      }
    }
    
    // Si está en modo multi-select (Command/Control presionado), permitir siempre
    if (isMultiSelectKey) {
      e.stopPropagation()
      if (objectRef.current) {
        onObjectClick(objectRef.current, true)
      }
      return
    }
    
    // Si el objeto está en un grupo seleccionado, no permitir selección individual (sin tecla modificadora)
    if (selectedObjects.length > 0 && selectedObjects.includes(objectRef.current!)) {
      e.stopPropagation()
      return
    }
    
    e.stopPropagation()
    if (on3DClick) {
      on3DClick()
    }
    if (objectRef.current) {
      onObjectClick(objectRef.current, false)
      // Actualizar cursor inmediatamente después de la selección
      setTimeout(() => {
        if (selectedObject === objectRef.current) {
          document.body.style.cursor = 'grab'
        }
      }, 0)
    }
  }, [objectRef, onObjectClick, on3DClick, selectedObject, interactionsDisabled, selectedObjects, getAllObjects])

  // Función para manejar hover
  const handlePointerEnter = useCallback((e: any) => {
    e.stopPropagation()
    // No cambiar cursor si las interacciones están deshabilitadas
    if (interactionsDisabled) return
    // Solo cambiar cursor si no estamos en drag
    if (!isDragging) {
      const isInGroup = selectedObjects.includes(objectRef.current!)
      
      // Solo verificar si tiene algo encima si NO está en selección múltiple
      if (!isInGroup && selectedObjects.length === 0 && objectRef.current) {
        const allObjects = getAllObjects()
        if (hasObjectOnTop(objectRef.current, allObjects)) {
          document.body.style.cursor = 'not-allowed'
          return
        }
      }
      
      if (selectedObject === objectRef.current || isInGroup) {
        document.body.style.cursor = 'grab' // Mano abierta para drag
      } else {
        document.body.style.cursor = 'pointer' // Mano con dedo para click
      }
    }
  }, [isDragging, selectedObject, objectRef, interactionsDisabled, selectedObjects, getAllObjects])

  // Función para manejar salida del hover
  const handlePointerLeave = useCallback((e: any) => {
    e.stopPropagation()
    // Solo restaurar cursor si no estamos en drag
    if (!isDragging) {
      document.body.style.cursor = 'auto'
    }
  }, [isDragging])

  // Función para manejar inicio de drag
  const handlePointerDown = useCallback((e: any) => {
    if (interactionsDisabled) {
      e.stopPropagation()
      return
    }
    handleDragStart(objectRef, e)
  }, [handleDragStart, objectRef, interactionsDisabled])

  // Crear los event handlers para inyectar en los children
  const eventHandlers = {
    onClick: handleClick,
    onPointerDown: handlePointerDown,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave
  }

  // Inyectar event handlers en todos los children de tipo "group"
  // Esto permite que los eventos solo se capturen en los meshes hijos, no en el wrapper
  const childrenWithHandlers = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === 'group') {
      // Clonar el group hijo e inyectar los handlers en sus meshes
      const childProps = child.props as any
      return React.cloneElement(child as React.ReactElement<any>, {
        ...(childProps || {}),
        children: React.Children.map(childProps.children, (grandchild) => {
          if (React.isValidElement(grandchild) && grandchild.type === 'mesh') {
            // Inyectar handlers solo en los meshes
            const grandchildProps = grandchild.props as any
            return React.cloneElement(grandchild as React.ReactElement<any>, {
              ...(grandchildProps || {}),
              ...eventHandlers
            })
          }
          return grandchild
        })
      })
    }
    return child
  })

  return <>{childrenWithHandlers}</>
}
export default SelectableObject


