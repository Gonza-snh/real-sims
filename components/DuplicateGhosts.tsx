import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import VectorVisualization from './VectorVisualization'
import { snapToGrid } from '@/utils/gridSnap'

interface DuplicateGhostsProps {
  isActive: boolean
  objectsToDuplicate: THREE.Object3D[]
  onDuplicateComplete: (offset: THREE.Vector3) => void
  onClickEvent?: THREE.Vector3 | null  // Recibe clicks desde Scene3D
  showGrid?: boolean  // Si la grilla está activa para snap
}

export interface DuplicateGhostsHandle {
  startPoint: THREE.Vector3 | null
  currentPoint: THREE.Vector3 | null
}

/**
 * Componente que muestra objetos fantasma (transparentes) durante el proceso de duplicación
 * Sigue el mouse y permite definir el offset de duplicación
 */
export default function DuplicateGhosts({
  isActive,
  objectsToDuplicate,
  onDuplicateComplete,
  onClickEvent = null,
  showGrid = false
}: DuplicateGhostsProps) {
  const { camera, raycaster, scene } = useThree()
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null)
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null)
  const [ghostObjects, setGhostObjects] = useState<THREE.Object3D[]>([])
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false)
  const [isManualInput, setIsManualInput] = useState<boolean>(false)
  const [manualDistance, setManualDistance] = useState<string>('')

  // Detectar tecla Shift, Tab y números para activar input manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar Shift
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
        return
      }
      
      // Si presiona Tab, activar input manual
      if (e.key === 'Tab' && startPoint && currentPoint) {
        e.preventDefault()
        setIsManualInput(true)
        return
      }
      
      // Si presiona un número (0-9) y no está editando, activar input manual
      if (isActive && startPoint && currentPoint && !isManualInput) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault()
          setIsManualInput(true)
          setManualDistance(e.key) // Comenzar con el número presionado
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false)
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [startPoint, currentPoint, isActive, isManualInput])

  // Limpiar fantasmas cuando se desactiva
  useEffect(() => {
    if (!isActive && ghostObjects.length > 0) {
      ghostObjects.forEach(ghost => scene.remove(ghost))
      setGhostObjects([])
      setStartPoint(null)
      setCurrentPoint(null)
      setIsManualInput(false)
      setManualDistance('')
    }
  }, [isActive, scene])
  
  // Limpiar fantasmas al desmontar
  useEffect(() => {
    return () => {
      ghostObjects.forEach(ghost => scene.remove(ghost))
    }
  }, [])

  // Manejar clicks recibidos desde Scene3D
  useEffect(() => {
    if (!isActive || !onClickEvent) return

    const clickPoint = onClickEvent

    if (!startPoint) {
      // Primer click: definir punto de inicio y crear fantasmas
      console.log('🎯 Primer click - Punto de inicio:', clickPoint)
      setStartPoint(clickPoint)
      setCurrentPoint(clickPoint) // Inicializar current point
      createGhostObjects(clickPoint)
    } else {
      // Segundo click: calcular offset y completar duplicación/movimiento
      console.log('🎯 Segundo click - Punto final:', clickPoint)
      
      // Aplicar snap ortogonal si Shift está presionado
      let finalPoint = clickPoint
      if (isShiftPressed) {
        const offset = clickPoint.clone().sub(startPoint)
        if (Math.abs(offset.x) > Math.abs(offset.z)) {
          finalPoint = new THREE.Vector3(clickPoint.x, 0, startPoint.z)
        } else {
          finalPoint = new THREE.Vector3(startPoint.x, 0, clickPoint.z)
        }
      }
      
      const offset = finalPoint.clone().sub(startPoint)
      console.log('📐 Offset final:', offset)
      onDuplicateComplete(offset)
    }
  }, [onClickEvent])

  // Seguir el mouse con los fantasmas
  useEffect(() => {
    if (!isActive || !startPoint || isManualInput) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      let mousePoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeY, mousePoint)

      if (!mousePoint) return

      // Aplicar snap a la grilla si está habilitada
      if (showGrid) {
        mousePoint = snapToGrid(mousePoint, true)
      }

      // Aplicar snap ortogonal si Shift está presionado (sobrescribe el snap de grilla)
      if (isShiftPressed) {
        const offset = mousePoint.clone().sub(startPoint)
        
        // Determinar eje dominante (X o Z)
        if (Math.abs(offset.x) > Math.abs(offset.z)) {
          // Snap a eje X (horizontal)
          mousePoint = new THREE.Vector3(mousePoint.x, 0, startPoint.z)
        } else {
          // Snap a eje Z (vertical/profundidad)
          mousePoint = new THREE.Vector3(startPoint.x, 0, mousePoint.z)
        }
      }

      setCurrentPoint(mousePoint)
      
      // Actualizar posición de fantasmas
      const offset = mousePoint.clone().sub(startPoint)
      updateGhostPositions(offset)
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove)
      return () => canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isActive, startPoint, camera, raycaster, isShiftPressed, isManualInput])

  const createGhostObjects = (startPosition: THREE.Vector3) => {
    const ghosts: THREE.Object3D[] = []

    objectsToDuplicate.forEach((obj) => {
      const ghost = obj.clone(true)
      
      // Hacer transparente todos los materiales
      ghost.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material.clone()
          material.transparent = true
          material.opacity = 0.5
          child.material = material
        }
      })

      // Inicialmente, los fantasmas están en la misma posición que los originales
      // Se actualizarán con el mouse
      scene.add(ghost)
      ghosts.push(ghost)
    })

    setGhostObjects(ghosts)
    console.log('👻 Creados', ghosts.length, 'objetos fantasma')
  }

  const updateGhostPositions = (offset: THREE.Vector3) => {
    objectsToDuplicate.forEach((original, index) => {
      if (ghostObjects[index]) {
        const newPos = original.position.clone().add(offset)
        ghostObjects[index].position.copy(newPos)
      }
    })
  }

  // Manejar input manual de distancia
  const handleManualDistanceSubmit = (distance: number) => {
    if (!startPoint || !currentPoint) return
    
    // Calcular dirección desde startPoint hacia currentPoint
    const direction = currentPoint.clone().sub(startPoint).normalize()
    
    // Crear nuevo punto a la distancia especificada (convertir cm a metros)
    const distanceInMeters = distance / 100
    const newEndPoint = startPoint.clone().add(direction.multiplyScalar(distanceInMeters))
    
    // Aplicar snap ortogonal si Shift está presionado
    let finalPoint = newEndPoint
    if (isShiftPressed) {
      const offset = newEndPoint.clone().sub(startPoint)
      if (Math.abs(offset.x) > Math.abs(offset.z)) {
        finalPoint = new THREE.Vector3(newEndPoint.x, 0, startPoint.z)
      } else {
        finalPoint = new THREE.Vector3(startPoint.x, 0, newEndPoint.z)
      }
    }
    
    // Calcular offset final y completar
    const offset = finalPoint.clone().sub(startPoint)
    onDuplicateComplete(offset)
    
    setIsManualInput(false)
    setManualDistance('')
  }

  return (
    <VectorVisualization
      startPoint={startPoint}
      endPoint={currentPoint}
      visible={!!startPoint && !!currentPoint}
      isManualInput={isManualInput}
      manualDistance={manualDistance}
      onManualDistanceChange={setManualDistance}
      onManualDistanceSubmit={handleManualDistanceSubmit}
      onManualInputCancel={() => {
        setIsManualInput(false)
        setManualDistance('')
      }}
    />
  )
}

