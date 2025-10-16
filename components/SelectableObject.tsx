import React, { useRef, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneObjects, useObjectRegistration } from '@/contexts/SceneObjectsContext'
import { checkCollisionWithObjects, tryPushObject } from '@/utils/collisionDetection'

interface SelectableObjectProps {
  children: React.ReactNode
  objectRef: React.RefObject<THREE.Group>
  selectedObject: THREE.Object3D | null
  onObjectClick: (object: THREE.Group) => void
  on3DClick?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
  objectId: string  // ID único para registro y detección de colisiones
}

const SelectableObject: React.FC<SelectableObjectProps> = ({
  children,
  objectRef,
  selectedObject,
  onObjectClick,
  on3DClick,
  onObjectDragStart,
  onObjectDragEnd,
  objectId
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
    if (!ref.current || selectedObject !== ref.current) return
    
    setIsDragging(true)
    setDragStartPos(ref.current.position.clone())
    setDragStartMouse({ x: e.clientX, y: e.clientY })
    
    if (onObjectDragStart) onObjectDragStart()
    
    // Cambiar cursor a grabbing
    document.body.style.cursor = 'grabbing'
  }, [selectedObject, onObjectDragStart])

  // Función para manejar el movimiento durante el drag
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartPos || !dragStartMouse || !objectRef.current) return

    const sensitivity = 0.01
    const deltaX = (e.clientX - dragStartMouse.x) * sensitivity
    const deltaY = (e.clientY - dragStartMouse.y) * sensitivity

    // Proyección en el plano XZ basada en la orientación de la cámara
    // Esto hace que el movimiento sea intuitivo desde cualquier ángulo de cámara
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))
    right.normalize()
    
    // Proyectar el movimiento del mouse en el plano XZ
    // - deltaX se mapea al vector "right" (derecha de la cámara)
    // - deltaY se mapea al vector "forward" (adelante de la cámara) CON INVERSIÓN
    const moveX = deltaX * right.x - deltaY * forward.x
    const moveZ = deltaX * right.z - deltaY * forward.z
    
    // Calcular nueva posición
    const newX = dragStartPos.x + moveX
    const newZ = dragStartPos.z + moveZ
    
    // Guardar posición actual para poder revertir si hay colisión
    const currentPosition = objectRef.current.position.clone()
    
    // Aplicar nueva posición temporalmente
    objectRef.current.position.x = newX
    objectRef.current.position.z = newZ
    objectRef.current.position.y = 0
    objectRef.current.updateWorldMatrix(true, true)
    
    // Verificar colisiones en tiempo real
    const otherObjects = getOtherObjects(objectId)
    if (otherObjects.length > 0) {
      const collidingObject = checkCollisionWithObjects(objectRef.current, otherObjects, 0.02)
      
      if (collidingObject) {
        // HAY COLISIÓN - intentar empujar el otro objeto
        const allObjects = getAllObjects()
        const pushSuccessful = tryPushObject(
          objectRef.current,
          collidingObject,
          allObjects
        )
        
        if (!pushSuccessful) {
          // No se pudo empujar → Bloqueo hard (revertir posición de A)
          objectRef.current.position.copy(currentPosition)
          objectRef.current.updateWorldMatrix(true, true)
        }
        // Si pushSuccessful === true, B se movió y A mantiene su nueva posición
      }
    }
  }, [isDragging, dragStartPos, dragStartMouse, objectRef, camera, getOtherObjects, getAllObjects, objectId])

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
    e.stopPropagation()
    if (on3DClick) {
      on3DClick()
    }
    if (objectRef.current) {
      onObjectClick(objectRef.current)
      // Actualizar cursor inmediatamente después de la selección
      setTimeout(() => {
        if (selectedObject === objectRef.current) {
          document.body.style.cursor = 'grab'
        }
      }, 0)
    }
  }, [objectRef, onObjectClick, on3DClick, selectedObject])

  // Función para manejar hover
  const handlePointerEnter = useCallback((e: any) => {
    e.stopPropagation()
    // Solo cambiar cursor si no estamos en drag
    if (!isDragging) {
      if (selectedObject === objectRef.current) {
        document.body.style.cursor = 'grab' // Mano abierta para drag
      } else {
        document.body.style.cursor = 'pointer' // Mano con dedo para click
      }
    }
  }, [isDragging, selectedObject, objectRef])

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
    handleDragStart(objectRef, e)
  }, [handleDragStart, objectRef])

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

