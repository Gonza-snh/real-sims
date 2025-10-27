import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html, Line } from '@react-three/drei'
import { snapToGrid } from '@/utils/gridSnap'
import { getMultiRotationColor } from '@/lib/colors'

interface ArcVisualizationProps {
  centerPoint: THREE.Vector3 | null
  startPoint: THREE.Vector3 | null
  endPoint: THREE.Vector3 | null
  angle: number
  visible: boolean
  isManualInput?: boolean
  manualAngle?: string
  onManualAngleChange?: (value: string) => void
  onManualAngleSubmit?: (angle: number) => void
  onManualInputCancel?: () => void
  showGrid?: boolean  // Si la grilla está activa para snap
}

/**
 * Componente que visualiza el arco de rotación en 3D
 * Muestra el centro, vectores inicial y final, y el arco entre ellos
 * En el primer click muestra solo un punto blanco 2D en el piso
 */
export default function ArcVisualization({
  centerPoint,
  startPoint,
  endPoint,
  angle,
  visible,
  isManualInput = false,
  manualAngle = '',
  onManualAngleChange,
  onManualAngleSubmit,
  onManualInputCancel,
  showGrid = false
}: ArcVisualizationProps) {
  // Si no está visible o no hay centerPoint, no mostrar nada
  if (!visible || !centerPoint) return null
  
  // FASE 1: Solo centerPoint (primer click) - mostrar solo la esfera
  if (!startPoint) {
    const snappedCenter = snapToGrid(centerPoint, showGrid)
    return (
      <group>
        {/* Esfera en el centro de rotación - igual que VectorVisualization */}
        <mesh position={snappedCenter}>
          <sphereGeometry args={[0.01, 12, 12]} />
          <meshBasicMaterial color={getMultiRotationColor()} />
        </mesh>
      </group>
    )
  }
  
  // FASE 2: centerPoint + startPoint pero sin endPoint (después del primer click, antes del segundo)
  // Mostrar esfera en centerPoint + línea hasta el mouse (endPoint)
  if (!endPoint) {
    const snappedCenter = snapToGrid(centerPoint, showGrid)
    const snappedStart = snapToGrid(startPoint, showGrid)
    
    return (
      <group>
        {/* Esfera en el centro de rotación */}
        <mesh position={snappedCenter}>
          <sphereGeometry args={[0.01, 12, 12]} />
          <meshBasicMaterial color={getMultiRotationColor()} />
        </mesh>
        
        {/* Línea desde el centro hasta el mouse */}
        <Line
          points={[snappedCenter, snappedStart]}
          color={getMultiRotationColor()}
          lineWidth={2}
          opacity={0.8}
          transparent
        />
      </group>
    )
  }

  const angleDegrees = Math.round((angle * 180) / Math.PI)
  
  // Aplicar snap a todos los puntos
  const snappedCenter = snapToGrid(centerPoint, showGrid)
  const snappedStart = snapToGrid(startPoint, showGrid)
  const snappedEnd = snapToGrid(endPoint, showGrid)
  
  // Calcular radio del arco (distancia desde centro al punto inicial)
  const radius = Math.sqrt(
    Math.pow(snappedStart.x - snappedCenter.x, 2) + 
    Math.pow(snappedStart.z - snappedCenter.z, 2)
  )

  // Generar puntos del arco
  const arcPoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 32
    
    // Calcular ángulo inicial
    const startAngle = Math.atan2(
      snappedStart.z - snappedCenter.z,
      snappedStart.x - snappedCenter.x
    )
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const currentAngle = startAngle + angle * t
      
      const x = snappedCenter.x + radius * Math.cos(currentAngle)
      const z = snappedCenter.z + radius * Math.sin(currentAngle)
      
      points.push(new THREE.Vector3(x, snappedCenter.y + 0.01, z))
    }
    
    return points
  }, [snappedCenter, snappedStart, angle, radius])

  // Líneas del vector inicial y final
  const startLine = useMemo(() => [snappedCenter, snappedStart], [snappedCenter, snappedStart])
  const endLine = useMemo(() => [snappedCenter, snappedEnd], [snappedCenter, snappedEnd])

  // Posición del label (en el punto medio del arco)
  const labelPosition = useMemo(() => {
    const midAngle = Math.atan2(
      snappedStart.z - snappedCenter.z,
      snappedStart.x - snappedCenter.x
    ) + angle / 2
    
    const labelRadius = radius * 0.7 // Un poco más cerca del centro
    const x = snappedCenter.x + labelRadius * Math.cos(midAngle)
    const z = snappedCenter.z + labelRadius * Math.sin(midAngle)
    
    return new THREE.Vector3(x, snappedCenter.y + 0.3, z)
  }, [snappedCenter, snappedStart, angle, radius])

  return (
    <group>
      {/* Centro de rotación */}
      <mesh position={snappedCenter}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshBasicMaterial color={getMultiRotationColor()} />
      </mesh>
      
      {/* Vector inicial (desde centro a punto inicial) */}
      <Line
        points={startLine}
        color={getMultiRotationColor()}
        lineWidth={2}
        opacity={0.6}
        transparent
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      
      {/* Vector final (desde centro a punto actual/final) */}
      <Line
        points={endLine}
        color={getMultiRotationColor()}
        lineWidth={2}
        opacity={0.6}
        transparent
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      
      {/* Arco que muestra la rotación */}
      <Line
        points={arcPoints}
        color={getMultiRotationColor()}
        lineWidth={3}
        opacity={0.9}
        transparent
      />
      
      {/* Punto en el inicio del arco */}
      <mesh position={snappedStart}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshBasicMaterial color={getMultiRotationColor()} />
      </mesh>
      
      {/* Punto en el final del arco */}
      <mesh position={snappedEnd}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshBasicMaterial color={getMultiRotationColor()} />
      </mesh>

      {/* Label con el ángulo en grados */}
      <Html position={[labelPosition.x, labelPosition.y, labelPosition.z]} center>
        {isManualInput ? (
          <input
            type="text"
            inputMode="numeric"
            value={manualAngle}
            onChange={(e) => {
              // Permitir números, punto, coma y signo menos
              const value = e.target.value
              if (value === '' || value === '-' || /^-?[0-9]*[.,]?[0-9]*$/.test(value)) {
                onManualAngleChange?.(value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualAngle && manualAngle !== '-') {
                e.preventDefault()
                // Convertir coma a punto antes de parsear
                const normalizedAngle = manualAngle.replace(',', '.')
                onManualAngleSubmit?.(Number.parseFloat(normalizedAngle))
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                onManualInputCancel?.()
              }
            }}
            autoFocus
            placeholder={`${angleDegrees}`}
            style={{
              background: 'rgba(36, 36, 35, 0.95)',
              color: 'var(--color-gris-claro)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-etiqueta)',
              fontSize: 'var(--font-etiqueta-size)',
              fontWeight: 600,
              border: '1px solid var(--color-gris-claro)',
              outline: 'none',
              width: 80,
              textAlign: 'center',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
            }}
          />
        ) : (
          <div
            style={{
              background: 'rgba(36, 36, 35, 0.9)',
              color: 'var(--color-gris-claro)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-etiqueta)',
              fontSize: 'var(--font-etiqueta-size)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {angleDegrees}°
          </div>
        )}
      </Html>
    </group>
  )
}

