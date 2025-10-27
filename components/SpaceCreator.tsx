import { useEffect, useState, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { snapToGrid } from '@/utils/gridSnap'

interface SpaceCreatorProps {
  isActive: boolean
  onClickEvent?: THREE.Vector3 | null
  onSpaceComplete: (space: { start: THREE.Vector3; end: THREE.Vector3; width: number; length: number; height: number }) => void
  showGrid?: boolean
  spaceHeight?: number  // Altura fija del recinto
}

/**
 * Componente para crear espacios/recintos con 2 clicks
 * Fase 1: Click inicial + fantasma del rectángulo que sigue el mouse
 * Fase 2: Click final + creación del recinto
 */
export default function SpaceCreator({
  isActive,
  onClickEvent = null,
  onSpaceComplete,
  showGrid = false,
  spaceHeight = 2.5  // Altura por defecto de 2.5 metros
}: SpaceCreatorProps) {
  const { camera, raycaster } = useThree()
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null)
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null)
  const [isFirstClickDone, setIsFirstClickDone] = useState(false)
  const [isManualInput, setIsManualInput] = useState<boolean>(false)
  const [manualInput, setManualInput] = useState<string>('')
  const [inputStep, setInputStep] = useState<'width' | 'length'>('width')
  const [manualWidth, setManualWidth] = useState<string>('')
  const [manualLength, setManualLength] = useState<string>('')
  const [showHeightInput, setShowHeightInput] = useState<boolean>(false)
  const [heightInput, setHeightInput] = useState<string>('')
  const heightInputRef = useRef<HTMLInputElement>(null)

  // Detectar teclas Tab y números para activar input manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // NO interferir si estamos en el input de altura
      if (showHeightInput) return
      
      // Si presiona Tab, activar input manual o cambiar entre width/length
      if (e.key === 'Tab' && isFirstClickDone && startPoint && currentPoint) {
        e.preventDefault()
        if (!isManualInput) {
          setIsManualInput(true)
          setInputStep('width')
          setManualInput('')
          // Inicializar manualWidth con el valor actual
          const currentWidth = Math.abs(currentPoint.x - startPoint.x) * 100
          setManualWidth(currentWidth.toFixed(0))
        } else {
          // Cambiar entre width y length
          const newStep = inputStep === 'width' ? 'length' : 'width'
          
          console.log('🏠 TAB - Cambiando paso:', { 
            from: inputStep, 
            to: newStep,
            manualWidth,
            manualLength,
            currentPoint: currentPoint?.clone()
          })
          
          setInputStep(newStep)
          setManualInput('')
          
          // Si cambiamos a length y ya tenemos width definido, usar ese valor
          if (newStep === 'length' && manualWidth) {
            console.log('🏠 Cambiando a largo, usando ancho guardado:', manualWidth)
          }
          // Si cambiamos a width y ya tenemos length definido, usar ese valor
          else if (newStep === 'width' && manualLength) {
            console.log('🏠 Cambiando a ancho, usando largo guardado:', manualLength)
          }
        }
        return
      }
      
      // Si presiona un número (0-9) y no está editando, activar input manual
      if (isActive && isFirstClickDone && startPoint && currentPoint && !isManualInput) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault()
          setIsManualInput(true)
          setInputStep('width')
          setManualInput(e.key) // Comenzar con el número presionado
          // NO resetear manualLength - mantener el valor guardado del segundo click
          // Solo inicializar manualWidth si está vacío (primera vez)
          if (!manualWidth) {
            const currentWidth = Math.abs(currentPoint.x - startPoint.x) * 100
            setManualWidth(currentWidth.toFixed(0))
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFirstClickDone, startPoint, currentPoint, isActive, isManualInput, showHeightInput])

  // Actualizar el fantasma cuando cambian las dimensiones manuales
  useEffect(() => {
    if (!isFirstClickDone || !startPoint || !currentPoint || !isManualInput) return
    
    // Solo actualizar si tenemos valores manuales válidos
    if (manualWidth && !isNaN(Number.parseFloat(manualWidth))) {
      const widthInMeters = Number.parseFloat(manualWidth) / 100
      const direction = currentPoint.x > startPoint.x ? 1 : -1
      
      const newCurrentPoint = new THREE.Vector3(
        startPoint.x + (widthInMeters * direction),
        0,
        currentPoint.z
      )
      
      // Solo actualizar si realmente cambió
      if (!newCurrentPoint.equals(currentPoint)) {
        console.log('🏠 ACTUALIZANDO FANTASMA POR ANCHO:', { 
          manualWidth, 
          widthInMeters, 
          direction,
          oldCurrentPoint: currentPoint.clone(),
          newCurrentPoint: newCurrentPoint.clone()
        })
        
        setCurrentPoint(newCurrentPoint)
      }
    }
    
    if (manualLength && !isNaN(Number.parseFloat(manualLength))) {
      const lengthInMeters = Number.parseFloat(manualLength) / 100
      const lengthDirection = currentPoint.z > startPoint.z ? 1 : -1
      
      const newCurrentPoint = new THREE.Vector3(
        currentPoint.x,
        0,
        startPoint.z + (lengthInMeters * lengthDirection)
      )
      
      // Solo actualizar si realmente cambió
      if (!newCurrentPoint.equals(currentPoint)) {
        console.log('🏠 ACTUALIZANDO FANTASMA POR LARGO:', { 
          manualLength, 
          lengthInMeters, 
          lengthDirection,
          oldCurrentPoint: currentPoint.clone(),
          newCurrentPoint: newCurrentPoint.clone()
        })
        
        setCurrentPoint(newCurrentPoint)
      }
    }
  }, [manualWidth, manualLength, isFirstClickDone, startPoint, isManualInput]) // Removido currentPoint de las dependencias

  // Manejar clicks recibidos desde Scene3D
  useEffect(() => {
    if (!isActive || !onClickEvent) return

    console.log('🏠 SpaceCreator recibió click:', onClickEvent)
    const clickPoint = snapToGrid(onClickEvent, showGrid)

    if (!isFirstClickDone) {
      // Primer click: definir esquina inicial
      console.log('🏠 Primer click - Esquina inicial:', clickPoint)
      setStartPoint(clickPoint)
      setCurrentPoint(clickPoint)
      setIsFirstClickDone(true)
    } else {
      // Segundo click: completar el espacio
      console.log('🏠 Segundo click - Esquina final:', clickPoint)
      
      // Calcular dimensiones del rectángulo
      const width = Math.abs(clickPoint.x - startPoint!.x)
      const length = Math.abs(clickPoint.z - startPoint!.z)
      
      console.log('🏠 Dimensiones calculadas:', { width, length })
      
      // Solo crear si tiene dimensiones mínimas
      if (width > 0.1 && length > 0.1) {
        console.log('🏠 Dimensiones válidas - Mostrando input de altura')
        // Guardar las dimensiones calculadas para el input de altura
        const widthCm = (width * 100).toFixed(0)
        const lengthCm = (length * 100).toFixed(0)
        console.log('🏠 Guardando dimensiones:', { widthCm, lengthCm })
        setManualWidth(widthCm)
        setManualLength(lengthCm)
        setCurrentPoint(clickPoint)
        setShowHeightInput(true)
        console.log('🏠 Estado actualizado - manualLength debería ser:', lengthCm)
      } else {
        console.log('🏠 Dimensiones muy pequeñas, pero permitiendo input manual')
        // No resetear, permitir input manual
      }
    }
  }, [onClickEvent, isActive, showGrid, isFirstClickDone, startPoint, onSpaceComplete])

  // Manejar input manual de dimensiones
  const handleManualDimensionSubmit = (dimension: number) => {
    if (!startPoint || !currentPoint) return
    
    console.log('🏠 handleManualDimensionSubmit INICIO:', { 
      dimension, 
      inputStep, 
      manualWidth, 
      manualLength,
      currentPoint: currentPoint.clone(),
      startPoint: startPoint.clone()
    })
    
    if (inputStep === 'width') {
      console.log('🏠 CONFIRMANDO ANCHO:', { dimension })
      
      // ACTUALIZAR manualWidth con el valor confirmado
      setManualWidth(dimension.toString())
      
      // Actualizar currentPoint para mostrar el fantasma actualizado
      const widthInMeters = dimension / 100
      const direction = currentPoint.x > startPoint.x ? 1 : -1
      
      const newCurrentPoint = new THREE.Vector3(
        startPoint.x + (widthInMeters * direction),
        0,
        currentPoint.z
      )
      
      console.log('🏠 NUEVO CURRENT POINT:', { 
        oldCurrentPoint: currentPoint.clone(),
        newCurrentPoint: newCurrentPoint.clone(),
        widthInMeters,
        direction,
        manualWidthActualizado: dimension.toString()
      })
      
      setCurrentPoint(newCurrentPoint)
      setInputStep('length')
      setManualInput('')
      console.log('🏠 ANCHO CONFIRMADO - Estado actualizado')
    } else {
      // Solo crear el espacio si ya tenemos el ancho definido
      if (!manualWidth) {
        console.log('🏠 Error: No hay ancho definido')
        return
      }
      
      // IMPORTANTE: Guardar el largo ANTES de mostrar el input de altura
      setManualLength(dimension.toString())
      console.log('🏠 LARGO CONFIRMADO - Mostrando input de altura')
      
      // Actualizar currentPoint con el largo confirmado
      const lengthInMeters = dimension / 100
      const lengthDirection = currentPoint.z > startPoint.z ? 1 : -1
      
      const finalCurrentPoint = new THREE.Vector3(
        currentPoint.x,
        0,
        startPoint.z + (lengthInMeters * lengthDirection)
      )
      
      setCurrentPoint(finalCurrentPoint)
      
      // Mostrar input de altura en lugar de crear el espacio inmediatamente
      setShowHeightInput(true)
      setIsManualInput(false)
      setManualInput('')
    }
  }

  // Handler simple para el input de altura
  const handleHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^[0-9]*[.,]?[0-9]*$/.test(value) || value === '') {
      setHeightInput(value)
    }
  }
  
  // Función para obtener el valor actual del input
  const getCurrentHeightValue = () => {
    if (heightInputRef.current) {
      return heightInputRef.current.value
    }
    return heightInput
  }

  // Manejar confirmación de altura
  const handleHeightConfirm = () => {
    // Usar el valor del input, o 240 por defecto si está vacío
    const currentValue = heightInput || '240'
    
    console.log('🏠 handleHeightConfirm INICIO:', { 
      startPoint, 
      currentPoint, 
      manualWidth, 
      manualLength, 
      heightInput,
      currentValue
    })
    
    if (!startPoint || !currentPoint || !manualWidth || !manualLength) {
      console.log('🏠 Error: Faltan datos para crear el espacio')
      return
    }

    const heightInCm = Number.parseFloat(currentValue)
    console.log('🏠 Altura parseada:', { currentValue, heightInCm, isNaN: isNaN(heightInCm) })
    
    if (isNaN(heightInCm) || heightInCm <= 0) {
      console.log('🏠 Error: Altura inválida')
      return
    }

    const widthInMeters = Number.parseFloat(manualWidth) / 100
    const lengthInMeters = Number.parseFloat(manualLength) / 100
    const heightInMeters = heightInCm / 100

    console.log('🏠 Creando espacio con dimensiones:', { widthInMeters, lengthInMeters, heightInMeters })

    // Calcular el punto final basado en las dimensiones y dirección correcta
    const widthDirection = currentPoint.x > startPoint.x ? 1 : -1
    const lengthDirection = currentPoint.z > startPoint.z ? 1 : -1

    const endPoint = new THREE.Vector3(
      startPoint.x + (widthInMeters * widthDirection),
      0,
      startPoint.z + (lengthInMeters * lengthDirection)
    )

    console.log('🏠 Punto final calculado:', endPoint)

    onSpaceComplete({
      start: startPoint,
      end: endPoint,
      width: widthInMeters,
      length: lengthInMeters,
      height: heightInMeters
    })

    // Resetear para el siguiente espacio
    setStartPoint(null)
    setCurrentPoint(null)
    setIsFirstClickDone(false)
    setIsManualInput(false)
    setManualWidth('')
    setManualLength('')
    setInputStep('width')
        setShowHeightInput(false)
        setHeightInput('')
  }

  // NO actualizar fantasma en tiempo real - solo cuando se confirma con Enter
  // El fantasma debe mantenerse estable mientras escribes

  // Seguir el mouse para mostrar el fantasma del rectángulo
  useEffect(() => {
    if (!isActive || !isFirstClickDone || !startPoint || isManualInput || showHeightInput) return

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
        setCurrentPoint(snappedPoint)
      }
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove)
      return () => canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isActive, isFirstClickDone, startPoint, camera, raycaster, showGrid, isManualInput, showHeightInput])

  // Resetear cuando se desactiva la herramienta completamente
  useEffect(() => {
    if (!isActive) {
      console.log('🏠 Herramienta desactivada - Reseteando todo')
      setStartPoint(null)
      setCurrentPoint(null)
      setIsFirstClickDone(false)
      setIsManualInput(false)
      setManualInput('')
      setManualWidth('')
      setManualLength('')
      setInputStep('width')
        setShowHeightInput(false)
        setHeightInput('')
    }
  }, [isActive])

  // Mostrar fantasma del rectángulo o input de altura
  if (!isFirstClickDone || !startPoint || !currentPoint) return null

  // Calcular las esquinas del rectángulo
  const minX = Math.min(startPoint.x, currentPoint.x)
  const maxX = Math.max(startPoint.x, currentPoint.x)
  const minZ = Math.min(startPoint.z, currentPoint.z)
  const maxZ = Math.max(startPoint.z, currentPoint.z)

  const width = Math.max(0.01, maxX - minX) // Mínimo 1cm para evitar NaN
  const length = Math.max(0.01, maxZ - minZ) // Mínimo 1cm para evitar NaN
  const centerX = (minX + maxX) / 2
  const centerZ = (minZ + maxZ) / 2

  return (
    <group>
      {/* Rectángulo fantasma en el suelo - SIEMPRE visible */}
      <mesh position={[centerX, 0.001, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshBasicMaterial 
          color="#F7F5EF" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Bordes del rectángulo - Líneas finas en el borde exterior */}
      {/* Borde superior */}
      <mesh position={[centerX, 0.002, minZ]}>
        <boxGeometry args={[width, 0.001, 0.005]} />
        <meshBasicMaterial color="#F7F5EF" />
      </mesh>
      {/* Borde inferior */}
      <mesh position={[centerX, 0.002, maxZ]}>
        <boxGeometry args={[width, 0.001, 0.005]} />
        <meshBasicMaterial color="#F7F5EF" />
      </mesh>
      {/* Borde izquierdo */}
      <mesh position={[minX, 0.002, centerZ]}>
        <boxGeometry args={[0.005, 0.001, length]} />
        <meshBasicMaterial color="#F7F5EF" />
      </mesh>
      {/* Borde derecho */}
      <mesh position={[maxX, 0.002, centerZ]}>
        <boxGeometry args={[0.005, 0.001, length]} />
        <meshBasicMaterial color="#F7F5EF" />
      </mesh>
      
      {/* Input de dimensiones - solo si NO estamos en modo altura */}
      {!showHeightInput && (
        <Html position={[centerX, 0.3, centerZ]} center>
          <div
            style={{
              background: 'rgba(36, 36, 35, 0.8)',
              color: '#F7F5EF',
              border: '1px solid #EFE9D3',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Espacio:</span>
            {isManualInput && inputStep === 'width' ? (
              <input
                type="text"
                inputMode="numeric"
                value={manualInput}
                onChange={(e) => {
                  // Solo permitir números, punto (.) y coma (,) como decimales
                  const value = e.target.value
                  console.log('🏠 INPUT ANCHO CAMBIO:', { 
                    value, 
                    manualWidth,
                    width: width * 100,
                    currentPoint: currentPoint?.clone()
                  })
                  if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                    setManualInput(value)
                    // ACTUALIZAR manualWidth en tiempo real mientras escribes
                    if (value && !isNaN(Number.parseFloat(value.replace(',', '.')))) {
                      setManualWidth(value)
                      console.log('🏠 MANUAL WIDTH ACTUALIZADO:', value)
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput) {
                    e.preventDefault()
                    // Convertir coma a punto antes de parsear
                    const normalizedValue = manualInput.replace(',', '.')
                    console.log('🏠 ENTER EN ANCHO:', { 
                      manualInput, 
                      normalizedValue,
                      parsed: Number.parseFloat(normalizedValue)
                    })
                    handleManualDimensionSubmit(Number.parseFloat(normalizedValue))
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setIsManualInput(false)
                    setManualInput('')
                    setManualWidth('')
                    setManualLength('')
                    setInputStep('width')
                  }
                }}
                autoFocus
                placeholder={`${(width * 100).toFixed(0)}`}
                style={{
                  background: 'rgba(36, 36, 35, 0.95)',
                  color: '#F7F5EF',
                  border: '1px solid #EFE9D3',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  width: '50px',
                  textAlign: 'center'
                }}
              />
            ) : (
              <span>{manualWidth || (width * 100).toFixed(0)}</span>
            )}
            <span>x</span>
            {isManualInput && inputStep === 'length' ? (
              <input
                type="text"
                inputMode="numeric"
                value={manualInput}
                onChange={(e) => {
                  // Solo permitir números, punto (.) y coma (,) como decimales
                  const value = e.target.value
                  console.log('🏠 INPUT LARGO CAMBIO:', { 
                    value, 
                    manualLength,
                    length: length * 100,
                    currentPoint: currentPoint?.clone()
                  })
                  if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                    setManualInput(value)
                    // ACTUALIZAR manualLength en tiempo real mientras escribes
                    if (value && !isNaN(Number.parseFloat(value.replace(',', '.')))) {
                      setManualLength(value)
                      console.log('🏠 MANUAL LENGTH ACTUALIZADO:', value)
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput) {
                    e.preventDefault()
                    // Convertir coma a punto antes de parsear
                    const normalizedValue = manualInput.replace(',', '.')
                    handleManualDimensionSubmit(Number.parseFloat(normalizedValue))
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setIsManualInput(false)
                    setManualInput('')
                    setManualWidth('')
                    setManualLength('')
                    setInputStep('width')
                  }
                }}
                autoFocus
                placeholder={`${(length * 100).toFixed(0)}`}
                style={{
                  background: 'rgba(36, 36, 35, 0.95)',
                  color: '#F7F5EF',
                  border: '1px solid #EFE9D3',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  width: '50px',
                  textAlign: 'center'
                }}
              />
            ) : (
              <span>{manualLength || (length * 100).toFixed(0)}</span>
            )}
            <span>cm</span>
          </div>
        </Html>
      )}
      
      {/* Input de altura - aparece después de completar el rectángulo */}
      {showHeightInput && (
        <Html position={[centerX, 0.5, centerZ]} center>
          <div
            style={{
              background: 'rgba(36, 36, 35, 0.8)',
              color: '#F7F5EF',
              border: '1px solid #EFE9D3',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Alto:</span>
            <input
              ref={heightInputRef}
              type="text"
              inputMode="numeric"
              value={heightInput}
              onChange={handleHeightInputChange}
              placeholder="240"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleHeightConfirm()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setShowHeightInput(false)
                  setHeightInput('')
                }
              }}
              autoFocus
              style={{
                background: 'rgba(36, 36, 35, 0.95)',
                color: '#F7F5EF',
                border: '1px solid #EFE9D3',
                borderRadius: '2px',
                padding: '2px 4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                width: '50px',
                textAlign: 'center'
              }}
            />
            <span>cm</span>
          </div>
        </Html>
      )}
    </group>
  )
}
