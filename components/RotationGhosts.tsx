import { useEffect, useState, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ArcVisualization from './ArcVisualization'

interface RotationGhostsProps {
  isActive: boolean
  objectsToRotate: THREE.Object3D[]
  onRotationComplete: (center: THREE.Vector3, angle: number) => void
  onClickEvent?: THREE.Vector3 | null
}

/**
 * Componente que muestra objetos fantasma rotados durante el proceso de rotación
 * Permite definir centro, ángulo inicial y ángulo final con 3 clicks
 */
export default function RotationGhosts({
  isActive,
  objectsToRotate,
  onRotationComplete,
  onClickEvent = null
}: RotationGhostsProps) {
  const { camera, raycaster, scene } = useThree()
  const [centerPoint, setCenterPoint] = useState<THREE.Vector3 | null>(null)
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null)
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null)
  const [ghostObjects, setGhostObjects] = useState<THREE.Object3D[]>([])
  const [ghostGroup, setGhostGroup] = useState<THREE.Group | null>(null)
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false)
  const [isManualInput, setIsManualInput] = useState<boolean>(false)
  const [manualAngle, setManualAngle] = useState<string>('')
  const [currentAngle, setCurrentAngle] = useState<number>(0)
  
  // Ref para recordar el ángulo anterior y evitar saltos en 180°/-180°
  const lastAngleRef = useRef<number>(0)

  // Detectar tecla Shift y números para activar input manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar Shift
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
        return
      }
      
      // Si presiona Tab, activar input manual
      if (e.key === 'Tab' && centerPoint && startPoint && currentPoint) {
        e.preventDefault()
        setIsManualInput(true)
        return
      }
      
      // Si presiona un número (0-9) o signo menos, activar input manual
      if (isActive && centerPoint && startPoint && currentPoint && !isManualInput) {
        if (/^[0-9-]$/.test(e.key)) {
          e.preventDefault()
          setIsManualInput(true)
          setManualAngle(e.key)
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
  }, [centerPoint, startPoint, currentPoint, isActive, isManualInput])

  // Limpiar fantasmas cuando se desactiva
  useEffect(() => {
    if (!isActive) {
      if (ghostGroup) {
        scene.remove(ghostGroup)
        setGhostGroup(null)
      }
      setGhostObjects([])
      setCenterPoint(null)
      setStartPoint(null)
      setCurrentPoint(null)
      setIsStartPointFixed(false)
      setIsManualInput(false)
      setManualAngle('')
      setCurrentAngle(0)
      lastAngleRef.current = 0
    }
  }, [isActive, scene, ghostGroup])
  
  // Limpiar fantasmas al desmontar
  useEffect(() => {
    return () => {
      if (ghostGroup) {
        scene.remove(ghostGroup)
      }
    }
  }, [ghostGroup, scene])

  // Estado para saber si startPoint ya fue fijado con click
  const [isStartPointFixed, setIsStartPointFixed] = useState<boolean>(false)

  // Manejar clicks recibidos desde Scene3D
  useEffect(() => {
    if (!isActive || !onClickEvent) return

    const clickPoint = onClickEvent

    if (!centerPoint) {
      // Primer click: definir centro de rotación
      console.log('🎯 Primer click - Centro de rotación:', clickPoint)
      setCenterPoint(clickPoint)
      setStartPoint(clickPoint) // Inicializar startPoint para que el mouse lo siga
    } else if (!isStartPointFixed) {
      // Segundo click: fijar punto inicial del vector
      // Aplicar snap ortogonal si Shift está presionado
      let finalPoint = clickPoint
      if (isShiftPressed) {
        const offset = clickPoint.clone().sub(centerPoint)
        if (Math.abs(offset.x) > Math.abs(offset.z)) {
          finalPoint = new THREE.Vector3(clickPoint.x, 0, centerPoint.z)
        } else {
          finalPoint = new THREE.Vector3(centerPoint.x, 0, clickPoint.z)
        }
      }
      
      console.log('🎯 Segundo click - Punto inicial (fijado):', finalPoint)
      setStartPoint(finalPoint)
      setIsStartPointFixed(true) // Marcar como fijado
      setCurrentPoint(finalPoint) // Inicializar currentPoint
      lastAngleRef.current = 0 // Resetear el ángulo acumulado
      createGhostObjects()
    } else if (startPoint) {
      // Tercer click: calcular ángulo y completar rotación
      console.log('🎯 Tercer click - Punto final:', clickPoint)
      
      // Calcular ángulo entre los dos vectores
      const vector1 = new THREE.Vector2(
        startPoint.x - centerPoint.x,
        startPoint.z - centerPoint.z
      )
      const vector2 = new THREE.Vector2(
        clickPoint.x - centerPoint.x,
        clickPoint.z - centerPoint.z
      )
      
      // Invertir el orden para que el ángulo siga la dirección del mouse
      let angle = Math.atan2(vector1.y, vector1.x) - Math.atan2(vector2.y, vector2.x)
      
      // Normalizar el ángulo para que esté en el rango -π a π
      while (angle > Math.PI) angle -= 2 * Math.PI
      while (angle < -Math.PI) angle += 2 * Math.PI
      
      // Aplicar snap a 45° si Shift está presionado
      if (isShiftPressed) {
        const snapAngle = Math.PI / 4 // 45 grados
        angle = Math.round(angle / snapAngle) * snapAngle
      }
      
      console.log('📐 Ángulo de rotación:', angle, 'radianes =', (angle * 180 / Math.PI).toFixed(1), '°')
      onRotationComplete(centerPoint, angle)
    }
  }, [onClickEvent])

  // Seguir el mouse 
  useEffect(() => {
    if (!isActive || !centerPoint || isManualInput) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const mousePoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeY, mousePoint)

      if (!mousePoint) return

      // FASE 1: Después del primer click, antes del segundo
      // Actualizar startPoint para que la línea siga al mouse
      if (!isStartPointFixed) {
        // Aplicar snap ortogonal si Shift está presionado
        let finalPoint = mousePoint
        if (isShiftPressed) {
          const offset = mousePoint.clone().sub(centerPoint)
          // Determinar eje dominante (X o Z)
          if (Math.abs(offset.x) > Math.abs(offset.z)) {
            // Snap a eje X (horizontal)
            finalPoint = new THREE.Vector3(mousePoint.x, 0, centerPoint.z)
          } else {
            // Snap a eje Z (vertical/profundidad)
            finalPoint = new THREE.Vector3(centerPoint.x, 0, mousePoint.z)
          }
        }
        setStartPoint(finalPoint)
        return
      }

      // FASE 2: Después del segundo click, antes del tercer click
      // Actualizar currentPoint y rotar los fantasmas
      setCurrentPoint(mousePoint)

      // Verificar que startPoint no sea null antes de calcular el ángulo
      if (!startPoint) return

      // Calcular ángulo entre los vectores
      const vector1 = new THREE.Vector2(
        startPoint.x - centerPoint.x,
        startPoint.z - centerPoint.z
      )
      const vector2 = new THREE.Vector2(
        mousePoint.x - centerPoint.x,
        mousePoint.z - centerPoint.z
      )
      
      // Invertir el orden para que el ángulo siga la dirección del mouse
      let rawAngle = Math.atan2(vector1.y, vector1.x) - Math.atan2(vector2.y, vector2.x)
      
      // Normalizar el ángulo raw al rango -π a π
      while (rawAngle > Math.PI) rawAngle -= 2 * Math.PI
      while (rawAngle < -Math.PI) rawAngle += 2 * Math.PI
      
      // Detectar saltos y mantener continuidad
      const lastAngle = lastAngleRef.current
      const diff = rawAngle - lastAngle
      
      let angle = rawAngle
      
      // Si el salto es mayor a π, ajustar para mantener continuidad
      if (diff > Math.PI) {
        // Saltó de negativo a positivo (ej: -170° a 170°)
        // Restar 360° para mantener la dirección
        angle = rawAngle - 2 * Math.PI
      } else if (diff < -Math.PI) {
        // Saltó de positivo a negativo (ej: 170° a -170°)
        // Sumar 360° para mantener la dirección
        angle = rawAngle + 2 * Math.PI
      }
      
      // Guardar el ángulo para la siguiente iteración
      lastAngleRef.current = angle
      
      // Aplicar snap a 45° si Shift está presionado
      if (isShiftPressed) {
        const snapAngle = Math.PI / 4 // 45 grados
        angle = Math.round(angle / snapAngle) * snapAngle
      }

      setCurrentAngle(angle)
      updateGhostRotations(angle)
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove)
      return () => canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isActive, centerPoint, startPoint, camera, raycaster, isShiftPressed, isManualInput, isStartPointFixed])

  const createGhostObjects = () => {
    if (!centerPoint) return
    
    // Crear un Group para agrupar todos los fantasmas
    const group = new THREE.Group()
    const ghosts: THREE.Object3D[] = []

    // Posicionar el Group en el centerPoint
    group.position.copy(centerPoint)
    
    // Agregar temporalmente el grupo a la escena para que tenga matriz mundial
    scene.add(group)

    objectsToRotate.forEach((obj) => {
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

      // Agregar temporalmente el fantasma a la escena
      scene.add(ghost)
      
      // Usar attach para que automáticamente convierta las coordenadas
      // de absolutas a relativas al Group
      group.attach(ghost)
      
      ghosts.push(ghost)
    })
    
    setGhostObjects(ghosts)
    setGhostGroup(group)
    console.log('👻 Creados', ghosts.length, 'objetos fantasma en Group posicionado en', centerPoint)
  }

  const updateGhostRotations = (angle: number) => {
    if (!ghostGroup) return
    
    // ¡Así de simple! Solo rotar el Group
    // Three.js maneja automáticamente la rotación de todos los hijos alrededor del origen del Group
    ghostGroup.rotation.y = angle
  }

  const handleManualAngleSubmit = (angleDegrees: number) => {
    if (!centerPoint) return
    
    const angleRadians = (angleDegrees * Math.PI) / 180
    console.log('📐 Ángulo manual:', angleDegrees, '° =', angleRadians, 'radianes')
    
    // Actualizar fantasmas con el ángulo manual
    updateGhostRotations(angleRadians)
    setCurrentAngle(angleRadians)
    setIsManualInput(false)
    setManualAngle('')
    
    // Completar la rotación
    onRotationComplete(centerPoint, angleRadians)
  }

  return (
    <ArcVisualization
      centerPoint={centerPoint}
      startPoint={startPoint}
      endPoint={currentPoint}
      angle={-currentAngle}
      visible={!!centerPoint}
      isManualInput={isManualInput}
      manualAngle={manualAngle}
      onManualAngleChange={setManualAngle}
      onManualAngleSubmit={handleManualAngleSubmit}
      onManualInputCancel={() => {
        setIsManualInput(false)
        setManualAngle('')
      }}
    />
  )
}

