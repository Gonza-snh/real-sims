import React, { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html, Line } from '@react-three/drei'

interface VectorVisualizationProps {
  startPoint: THREE.Vector3 | null
  endPoint: THREE.Vector3 | null
  visible: boolean
  isManualInput?: boolean
  manualDistance?: string
  onManualDistanceChange?: (value: string) => void
  onManualDistanceSubmit?: (distance: number) => void
  onManualInputCancel?: () => void
}

/**
 * Visualización del vector de movimiento/duplicación
 * Muestra una línea desde el punto de inicio hasta el punto final
 * con un punto en el origen y la distancia en centímetros en el medio
 */
export default function VectorVisualization({
  startPoint,
  endPoint,
  visible,
  isManualInput = false,
  manualDistance = '',
  onManualDistanceChange,
  onManualDistanceSubmit,
  onManualInputCancel
}: VectorVisualizationProps) {
  if (!visible || !startPoint || !endPoint) return null

  // Calcular distancia en centímetros (1 unidad = 1 cm)
  const distance = startPoint.distanceTo(endPoint)
  const distanceCm = Math.round(distance * 100) // Convertir a cm y redondear

  // Calcular punto medio para el label
  const midPoint = new THREE.Vector3().lerpVectors(startPoint, endPoint, 0.5)

  const points = useMemo(() => [startPoint, endPoint], [startPoint, endPoint])

  return (
    <group>
      {/* Línea del vector */}
      <Line
        points={points}
        color="#EFE9D3"
        lineWidth={2}
        opacity={0.8}
        transparent
      />

      {/* Punto de inicio */}
      <mesh position={startPoint}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#EFE9D3" />
      </mesh>

      {/* Label con la distancia en el punto medio */}
      <Html position={[midPoint.x, midPoint.y + 0.3, midPoint.z]} center>
              {isManualInput ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualDistance}
                  onChange={(e) => {
                    // Solo permitir números, punto (.) y coma (,) como decimales
                    const value = e.target.value
                    if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                      onManualDistanceChange?.(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualDistance) {
                      e.preventDefault()
                      // Convertir coma a punto antes de parsear
                      const normalizedDistance = manualDistance.replace(',', '.')
                      onManualDistanceSubmit?.(Number.parseFloat(normalizedDistance))
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      onManualInputCancel?.()
                    }
                  }}
                  autoFocus
                  placeholder={`${distanceCm}`}
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
                    MozAppearance: 'textfield', // Firefox
                    WebkitAppearance: 'none', // Safari/Chrome
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
            {distanceCm} cm
          </div>
        )}
      </Html>
    </group>
  )
}

